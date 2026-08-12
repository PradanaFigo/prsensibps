from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models import Attendance, AttendanceStatusEnum, User, AppSetting
from app.schemas import AttendanceCreate, AttendanceOut
from app.utils.geo import haversine_meters
from app.utils.timezone import get_now_wib, get_today_wib

router = APIRouter(prefix="/attendance", tags=["Absensi"])


@router.post("/masuk", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def absen_masuk(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = get_today_wib()

    already = (
        db.query(Attendance)
        .filter(Attendance.user_id == current_user.id, Attendance.tanggal == today)
        .first()
    )
    if already and already.jam_masuk:
        raise HTTPException(status_code=400, detail="Anda sudah absen masuk hari ini")

    jarak = haversine_meters(
        payload.latitude, payload.longitude, settings.OFFICE_LATITUDE, settings.OFFICE_LONGITUDE
    )

    # Check dynamic radius setting
    radius_setting = db.query(AppSetting).filter(AppSetting.key == "OFFICE_RADIUS_METERS").first()
    allowed_radius = float(radius_setting.value) if radius_setting else settings.OFFICE_RADIUS_METERS

    if jarak > allowed_radius:
        raise HTTPException(
            status_code=400,
            detail=f"Anda berada di luar area kantor (jarak {int(jarak)} meter dari kantor. Batas: {int(allowed_radius)}m)",
        )

    now = get_now_wib()
    
    # Check dynamic setting first
    setting = db.query(AppSetting).filter(AppSetting.key == "ATTENDANCE_CUTOFF_TIME").first()
    cutoff_time_str = setting.value if setting else settings.ATTENDANCE_CUTOFF_TIME
    
    cutoff_hour, cutoff_minute = map(int, cutoff_time_str.split(":"))
    cutoff = now.replace(hour=cutoff_hour, minute=cutoff_minute, second=0, microsecond=0)

    status_absen = AttendanceStatusEnum.hadir if now <= cutoff else AttendanceStatusEnum.telat

    if already:
        # Update existing record if generated somehow (e.g., leave request created it?)
        already.jam_masuk = now.time()
        already.latitude_masuk = payload.latitude
        already.longitude_masuk = payload.longitude
        already.jarak_masuk = jarak
        already.status = status_absen
        new_attendance = already
    else:
        new_attendance = Attendance(
            user_id=current_user.id,
            tanggal=today,
            jam_masuk=now.time(),
            latitude_masuk=payload.latitude,
            longitude_masuk=payload.longitude,
            jarak_masuk=jarak,
            status=status_absen,
        )
        db.add(new_attendance)

    db.commit()
    db.refresh(new_attendance)
    return new_attendance


@router.post("/pulang", response_model=AttendanceOut, status_code=status.HTTP_200_OK)
def absen_pulang(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = get_today_wib()
    attendance = (
        db.query(Attendance)
        .filter(Attendance.user_id == current_user.id, Attendance.tanggal == today)
        .first()
    )

    if not attendance or not attendance.jam_masuk:
        raise HTTPException(status_code=400, detail="Anda belum absen masuk hari ini")
        
    if attendance.jam_pulang:
        raise HTTPException(status_code=400, detail="Anda sudah absen pulang hari ini")

    jarak = haversine_meters(
        payload.latitude, payload.longitude, settings.OFFICE_LATITUDE, settings.OFFICE_LONGITUDE
    )

    # Check dynamic radius setting
    radius_setting = db.query(AppSetting).filter(AppSetting.key == "OFFICE_RADIUS_METERS").first()
    allowed_radius = float(radius_setting.value) if radius_setting else settings.OFFICE_RADIUS_METERS

    if jarak > allowed_radius:
        raise HTTPException(
            status_code=400,
            detail=f"Anda berada di luar area kantor (jarak {int(jarak)} meter dari kantor. Batas: {int(allowed_radius)}m)",
        )

    attendance.jam_pulang = get_now_wib().time()
    attendance.latitude_pulang = payload.latitude
    attendance.longitude_pulang = payload.longitude
    attendance.jarak_pulang = jarak
    
    db.commit()
    db.refresh(attendance)
    return attendance


@router.get("/me", response_model=list[AttendanceOut])
def riwayat_absen_saya(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Attendance)
        .filter(Attendance.user_id == current_user.id)
        .order_by(Attendance.tanggal.desc())
        .all()
    )


@router.get("/today", response_model=AttendanceOut)
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = get_today_wib()
    attendance = (
        db.query(Attendance)
        .filter(Attendance.user_id == current_user.id, Attendance.tanggal == today)
        .first()
    )
    if not attendance:
        raise HTTPException(status_code=404, detail="Belum ada data absen hari ini")
    return attendance
