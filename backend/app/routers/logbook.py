from typing import List
import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Font
from io import BytesIO

from app.database import get_db
from app.models import Logbook, RoleEnum, User
from app.schemas import LogbookCreate, LogbookUpdate, LogbookOut
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/logbook", tags=["Logbook"])

@router.post("/", response_model=LogbookOut)
def create_logbook(
    logbook_in: LogbookCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Cek apakah sudah ada logbook di tanggal yang sama untuk user tersebut
    existing = db.query(Logbook).filter(
        Logbook.user_id == current_user.id,
        Logbook.tanggal == logbook_in.tanggal
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Logbook untuk tanggal ini sudah diisi."
        )
        
    new_log = Logbook(
        user_id=current_user.id,
        tanggal=logbook_in.tanggal,
        kegiatan=logbook_in.kegiatan
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@router.get("/me", response_model=List[LogbookOut])
def get_my_logbooks(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mendapatkan semua logbook milik user yang sedang login"""
    logs = db.query(Logbook).filter(Logbook.user_id == current_user.id).order_by(Logbook.tanggal.desc()).all()
    return logs


@router.put("/{log_id}", response_model=LogbookOut)
def update_logbook(
    log_id: uuid.UUID,
    log_in: LogbookUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    log = db.query(Logbook).filter(Logbook.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Logbook tidak ditemukan")
    if log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak memiliki akses untuk mengubah logbook ini")

    if log_in.tanggal is not None:
        log.tanggal = log_in.tanggal
    if log_in.kegiatan is not None:
        log.kegiatan = log_in.kegiatan

    db.commit()
    db.refresh(log)
    return log


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_logbook(
    log_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    log = db.query(Logbook).filter(Logbook.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Logbook tidak ditemukan")
    if log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak memiliki akses untuk menghapus logbook ini")

    db.delete(log)
    db.commit()
    return None



@router.get("/", response_model=List[LogbookOut])
def get_all_logbooks(
    tanggal: date = None,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    """Admin melihat semua logbook, bisa difilter berdasarkan tanggal"""
    query = db.query(Logbook)
    if tanggal:
        query = query.filter(Logbook.tanggal == tanggal)
    
    logs = query.order_by(Logbook.tanggal.desc()).all()
    return logs


@router.get("/export")
def export_logbook_excel(
    tanggal_awal: date = None,
    tanggal_akhir: date = None,
    db: Session = Depends(get_db),
    admin_user = Depends(require_admin)
):
    query = db.query(Logbook).join(User)
    if tanggal_awal:
        query = query.filter(Logbook.tanggal >= tanggal_awal)
    if tanggal_akhir:
        query = query.filter(Logbook.tanggal <= tanggal_akhir)
    logs = query.order_by(Logbook.tanggal.asc(), User.nama.asc()).all()

    # Pre-fetch users for names
    users = db.query(User).all()
    user_map = {u.id: u.nama for u in users}

    wb = Workbook()
    ws = wb.active
    ws.title = "Rekap Logbook"
    
    headers = ["Nama", "Tanggal", "Kegiatan", "Waktu Pengisian"]
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)
        
    for log in logs:
        ws.append([
            user_map.get(log.user_id, "Unknown"),
            log.tanggal.strftime("%d-%m-%Y"),
            log.kegiatan,
            (log.created_at + timedelta(hours=7)).strftime("%d-%m-%Y %H:%M:%S")
        ])
        
    for col in ws.columns:
        max_length = max(len(str(cell.value)) for cell in col)
        # Limit width for kegiatan
        ws.column_dimensions[col[0].column_letter].width = min(max_length + 4, 100)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    if tanggal_awal and tanggal_akhir:
        filename = f"rekap_logbook_{tanggal_awal}_sampai_{tanggal_akhir}.xlsx"
    elif tanggal_awal:
        filename = f"rekap_logbook_mulai_{tanggal_awal}.xlsx"
    elif tanggal_akhir:
        filename = f"rekap_logbook_sampai_{tanggal_akhir}.xlsx"
    else:
        filename = "rekap_logbook_semua.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
