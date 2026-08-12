from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Attendance, LeaveRequest, RoleEnum, AttendanceStatusEnum, LeaveStatusEnum
from app.schemas import AdminDashboardStats, UserDashboardStats, WeeklyData, CompositionData
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/admin", response_model=AdminDashboardStats)
def get_admin_stats(db: Session = Depends(get_db), admin_user = Depends(require_admin)):
    today = date.today()
    
    total_peserta = db.query(User).filter(User.role == RoleEnum.user, User.is_deleted == False).count()
    
    hadir_hari_ini = db.query(Attendance).filter(
        Attendance.tanggal == today,
        Attendance.status == AttendanceStatusEnum.hadir
    ).count()

    telat_hari_ini = db.query(Attendance).filter(
        Attendance.tanggal == today,
        Attendance.status == AttendanceStatusEnum.telat
    ).count()
    
    izin_hari_ini = db.query(LeaveRequest).filter(
        LeaveRequest.tanggal == today,
        LeaveRequest.status_approval == LeaveStatusEnum.disetujui
    ).count()
    
    if today.weekday() >= 5:
        alpa_hari_ini = 0
    else:
        alpa_hari_ini = max(0, total_peserta - hadir_hari_ini - telat_hari_ini - izin_hari_ini)
    
    first_day = today.replace(day=1)
    
    hadir_bulan_ini = db.query(Attendance).filter(
        Attendance.tanggal >= first_day,
        Attendance.tanggal <= today,
        Attendance.status == AttendanceStatusEnum.hadir
    ).count()

    telat_bulan_ini = db.query(Attendance).filter(
        Attendance.tanggal >= first_day,
        Attendance.tanggal <= today,
        Attendance.status == AttendanceStatusEnum.telat
    ).count()
    
    izin_bulan_ini = db.query(LeaveRequest).filter(
        LeaveRequest.tanggal >= first_day,
        LeaveRequest.tanggal <= today,
        LeaveRequest.status_approval == LeaveStatusEnum.disetujui
    ).count()
    
    workdays_so_far = sum(1 for i in range((today - first_day).days + 1) if (first_day + timedelta(days=i)).weekday() < 5)
    total_expected = workdays_so_far * total_peserta
    alpa_bulan_ini = max(0, total_expected - hadir_bulan_ini - telat_bulan_ini - izin_bulan_ini)
    
    composition = [
        CompositionData(name="Hadir", value=hadir_bulan_ini, color="#10b981"),
        CompositionData(name="Telat", value=telat_bulan_ini, color="#c28f32"),
        CompositionData(name="Izin", value=izin_bulan_ini, color="#3b82f6"),
        CompositionData(name="Alpa", value=alpa_bulan_ini, color="#ef4444")
    ]
    
    weekly_data = []
    # Current week (Monday to Friday)
    start_of_week = today - timedelta(days=today.weekday())
    workdays = [start_of_week + timedelta(days=i) for i in range(5)]

    for d in workdays:
        if d > today:
            h_count = 0
            t_count = 0
            i_count = 0
            a_count = 0
        else:
            h_count = db.query(Attendance).filter(
                Attendance.tanggal == d,
                Attendance.status == AttendanceStatusEnum.hadir
            ).count()

            t_count = db.query(Attendance).filter(
                Attendance.tanggal == d,
                Attendance.status == AttendanceStatusEnum.telat
            ).count()
            
            i_count = db.query(LeaveRequest).filter(
                LeaveRequest.tanggal == d,
                LeaveRequest.status_approval == LeaveStatusEnum.disetujui
            ).count()
            
            a_count = max(0, total_peserta - h_count - t_count - i_count)
        
        day_name = d.strftime("%A")[:3]  # Mon, Tue, etc.
        # simple translation
        days_id = {"Mon": "Sen", "Tue": "Sel", "Wed": "Rab", "Thu": "Kam", "Fri": "Jum", "Sat": "Sab", "Sun": "Min"}
        
        weekly_data.append(WeeklyData(
            name=days_id.get(day_name, day_name),
            hadir=h_count,
            telat=t_count,
            izin=i_count,
            alpa=a_count
        ))
        
    return AdminDashboardStats(
        total_peserta=total_peserta,
        hadir_hari_ini=hadir_hari_ini,
        telat_hari_ini=telat_hari_ini,
        izin_hari_ini=izin_hari_ini,
        alpa_hari_ini=alpa_hari_ini,
        weekly_data=weekly_data,
        composition_data=composition
    )

@router.get("/user/me", response_model=UserDashboardStats)
def get_user_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    today = date.today()
    first_day = today.replace(day=1)
    
    hadir_bulan_ini = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.tanggal >= first_day,
        Attendance.tanggal <= today,
        Attendance.status == AttendanceStatusEnum.hadir
    ).count()

    telat_bulan_ini = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.tanggal >= first_day,
        Attendance.tanggal <= today,
        Attendance.status == AttendanceStatusEnum.telat
    ).count()
    
    izin_bulan_ini = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.tanggal >= first_day,
        LeaveRequest.tanggal <= today,
        LeaveRequest.status_approval == LeaveStatusEnum.disetujui
    ).count()
    
    workdays_so_far = sum(1 for i in range((today - first_day).days + 1) if (first_day + timedelta(days=i)).weekday() < 5)
    
    alpa_bulan_ini = max(0, workdays_so_far - hadir_bulan_ini - telat_bulan_ini - izin_bulan_ini)
    
    composition = [
        CompositionData(name="Hadir", value=hadir_bulan_ini, color="#10b981"),
        CompositionData(name="Telat", value=telat_bulan_ini, color="#c28f32"),
        CompositionData(name="Izin", value=izin_bulan_ini, color="#3b82f6"),
        CompositionData(name="Alpa", value=alpa_bulan_ini, color="#ef4444")
    ]
    
    weekly_data = []
    # Current week (Monday to Friday)
    start_of_week = today - timedelta(days=today.weekday())
    workdays = [start_of_week + timedelta(days=i) for i in range(5)]

    for d in workdays:
        if d > today:
            h_count = 0
            t_count = 0
            i_count = 0
            a_count = 0
        else:
            h_count = db.query(Attendance).filter(
                Attendance.user_id == current_user.id,
                Attendance.tanggal == d,
                Attendance.status == AttendanceStatusEnum.hadir
            ).count()

            t_count = db.query(Attendance).filter(
                Attendance.user_id == current_user.id,
                Attendance.tanggal == d,
                Attendance.status == AttendanceStatusEnum.telat
            ).count()
            
            i_count = db.query(LeaveRequest).filter(
                LeaveRequest.user_id == current_user.id,
                LeaveRequest.tanggal == d,
                LeaveRequest.status_approval == LeaveStatusEnum.disetujui
            ).count()
            
            a_count = max(0, 1 - h_count - t_count - i_count)
            
        day_name = d.strftime("%A")[:3]
        days_id = {"Mon": "Sen", "Tue": "Sel", "Wed": "Rab", "Thu": "Kam", "Fri": "Jum"}
        
        weekly_data.append(WeeklyData(
            name=days_id.get(day_name, day_name),
            hadir=h_count,
            telat=t_count,
            izin=i_count,
            alpa=a_count
        ))
        
    return UserDashboardStats(
        hadir_bulan_ini=hadir_bulan_ini,
        telat_bulan_ini=telat_bulan_ini,
        izin_bulan_ini=izin_bulan_ini,
        alpa_bulan_ini=alpa_bulan_ini,
        weekly_data=weekly_data,
        composition_data=composition
    )
