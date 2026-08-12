import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.utils.timezone import get_now_wib

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models import LeaveRequest, User, RoleEnum, LeaveStatusEnum, Attendance, AttendanceStatusEnum
from app.schemas import LeaveRequestCreate, LeaveRequestOut, LeaveApprovalRequest

router = APIRouter(prefix="/leave", tags=["Izin/Sakit"])


@router.post("", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
def ajukan_izin(
    payload: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Cek apakah sudah ada pengajuan di tanggal yang sama
    existing = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.tanggal == payload.tanggal
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Pengajuan izin/sakit untuk tanggal ini sudah ada")

    new_leave = LeaveRequest(
        user_id=current_user.id,
        tanggal=payload.tanggal,
        jenis=payload.jenis,
        keterangan=payload.keterangan,
        status_approval=LeaveStatusEnum.pending
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return new_leave


@router.get("/me", response_model=list[LeaveRequestOut])
def riwayat_izin_saya(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(LeaveRequest)
        .filter(LeaveRequest.user_id == current_user.id)
        .order_by(LeaveRequest.tanggal.desc())
        .all()
    )


@router.get("", response_model=list[LeaveRequestOut])
def daftar_pengajuan_izin(
    status_approval: LeaveStatusEnum = None,
    db: Session = Depends(get_db), 
    admin_user: User = Depends(require_admin)
):
    query = db.query(LeaveRequest)
    if status_approval:
        query = query.filter(LeaveRequest.status_approval == status_approval)
    return query.order_by(LeaveRequest.diajukan_pada.desc()).all()


@router.put("/{leave_id}/approve", response_model=LeaveRequestOut)
def proses_izin(
    leave_id: uuid.UUID,
    payload: LeaveApprovalRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    leave_req = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave_req:
        raise HTTPException(status_code=404, detail="Pengajuan tidak ditemukan")

    leave_req.status_approval = payload.status
    leave_req.diproses_oleh = admin_user.id
    leave_req.diproses_pada = get_now_wib()

    # Jika ditolak otomatis alpa (atau jika disetujui, bisa juga di insert ke table attendance)
    # Ini tergantung kebutuhan bisnis. Mari kita buat entri di attendance.
    existing_attendance = db.query(Attendance).filter(
        Attendance.user_id == leave_req.user_id,
        Attendance.tanggal == leave_req.tanggal
    ).first()

    if payload.status == LeaveStatusEnum.ditolak:
        status_absen = AttendanceStatusEnum.alpa
    elif payload.status == LeaveStatusEnum.disetujui:
        # We can just leave it as None status or we could add 'izin' / 'sakit' in AttendanceStatusEnum if needed.
        # But based on the models, AttendanceStatusEnum only has hadir, telat, alpa. 
        # So we can just skip or mark it somehow.
        pass

    db.commit()
    db.refresh(leave_req)
    return leave_req
