from datetime import date, timedelta, time
from io import BytesIO

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Font
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import Attendance, LeaveRequest, User, LeaveStatusEnum, AttendanceStatusEnum
from app.schemas import RekapRow, UpdateStatusRequest

router = APIRouter(prefix="/recap", tags=["Rekap (Admin)"])


def _generate_rekap(db: Session, tanggal_awal: date, tanggal_akhir: date) -> list[RekapRow]:
    """Menyusun rekap per periode untuk semua user, termasuk status Alpa yang dihitung on-the-fly."""
    users = db.query(User).filter(User.role == "user", User.is_deleted == False).order_by(User.nama.asc()).all()  # noqa: E712

    attendances = (
        db.query(Attendance)
        .filter(Attendance.tanggal >= tanggal_awal, Attendance.tanggal <= tanggal_akhir)
        .all()
    )
    # Hanya leave request yang disetujui yang masuk rekap sebagai izin/sakit
    leaves = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.tanggal >= tanggal_awal, LeaveRequest.tanggal <= tanggal_akhir, LeaveRequest.status_approval == LeaveStatusEnum.disetujui)
        .all()
    )

    attendance_map = {(a.user_id, a.tanggal): a for a in attendances}
    leave_map = {(l.user_id, l.tanggal): l for l in leaves}

    rows: list[RekapRow] = []
    total_hari = (tanggal_akhir - tanggal_awal).days + 1

    for i in range(total_hari):
        tanggal = tanggal_awal + timedelta(days=i)
        if tanggal.weekday() >= 5:
            continue
        for user in users:
            key = (user.id, tanggal)

            if key in leave_map:
                l = leave_map[key]
                rows.append(
                    RekapRow(
                        user_id=user.id,
                        nama=user.nama,
                        tanggal=tanggal,
                        status=l.jenis.value.capitalize(),
                        keterangan=l.keterangan,
                    )
                )
            elif key in attendance_map:
                a = attendance_map[key]
                status_str = a.status.value.capitalize() if a.status else "Belum lengkap"
                rows.append(
                    RekapRow(
                        user_id=user.id,
                        nama=user.nama,
                        tanggal=tanggal,
                        jam_masuk=a.jam_masuk,
                        jam_pulang=a.jam_pulang,
                        status=status_str,
                        jarak_dari_kantor=round(a.jarak_masuk, 1) if a.jarak_masuk else None,
                    )
                )
            else:
                rows.append(RekapRow(user_id=user.id, nama=user.nama, tanggal=tanggal, status="Alpa"))

    return rows


@router.get("", response_model=list[RekapRow])
def get_rekap(
    tanggal_awal: date = Query(...),
    tanggal_akhir: date = Query(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return _generate_rekap(db, tanggal_awal, tanggal_akhir)

@router.put("/update-status")
def update_attendance_status(
    payload: UpdateStatusRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    att = db.query(Attendance).filter(
        Attendance.user_id == payload.user_id,
        Attendance.tanggal == payload.tanggal
    ).first()
    
    status_lower = payload.status.lower()
    
    if status_lower == "alpa":
        if att:
            db.delete(att)
            db.commit()
        return {"message": "Status berhasil diubah menjadi Alpa"}
        
    try:
        status_enum = AttendanceStatusEnum(status_lower)
    except ValueError:
        raise HTTPException(status_code=400, detail="Status tidak valid")
        
    if att:
        att.status = status_enum
    else:
        jam = time(8, 0) if status_enum == AttendanceStatusEnum.hadir else time(9, 0)
        new_att = Attendance(
            user_id=payload.user_id,
            tanggal=payload.tanggal,
            status=status_enum,
            jam_masuk=jam
        )
        db.add(new_att)
        
    db.commit()
    return {"message": f"Status berhasil diubah menjadi {status_enum.value.capitalize()}"}


@router.get("/export")
def export_rekap_excel(
    tanggal_awal: date = Query(...),
    tanggal_akhir: date = Query(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    rows = _generate_rekap(db, tanggal_awal, tanggal_akhir)

    wb = Workbook()
    ws = wb.active
    ws.title = "Rekap Absensi"

    headers = ["Nama", "Tanggal", "Jam Masuk", "Jam Pulang", "Status", "Jarak dari Kantor (m)", "Keterangan"]
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)

    for row in rows:
        ws.append(
            [
                row.nama,
                row.tanggal.strftime("%d-%m-%Y"),
                row.jam_masuk.strftime("%H:%M") if row.jam_masuk else "-",
                row.jam_pulang.strftime("%H:%M") if row.jam_pulang else "-",
                row.status,
                row.jarak_dari_kantor if row.jarak_dari_kantor is not None else "-",
                row.keterangan or "-",
            ]
        )

    for col in ws.columns:
        max_length = max(len(str(cell.value)) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = max_length + 4

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"rekap_absensi_{tanggal_awal}_{tanggal_akhir}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

