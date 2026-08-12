from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Attendance, LeaveRequest, RoleEnum, AttendanceStatusEnum, LeaveStatusEnum
from app.schemas import AdminDashboardStats, UserDashboardStats, WeeklyData, CompositionData
from app.auth import get_current_user, require_admin
from app.utils.timezone import get_today_wib

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/admin", response_model=AdminDashboardStats)
def get_admin_stats(db: Session = Depends(get_db), admin_user = Depends(require_admin)):
    today = get_today_wib()
    
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
    
    total_expected_attendances = workdays_so_far * total_peserta
    
    hadir_minggu_lalu = 0
    izin_minggu_lalu = 0
    alpa_minggu_lalu = 0
    
    if today.weekday() == 0:
        last_monday = today - timedelta(days=7)
    else:
        last_monday = today - timedelta(days=today.weekday() + 7)
    
    for i in range(5):
        day = last_monday + timedelta(days=i)
        
        hadir = db.query(Attendance).filter(
            Attendance.tanggal == day,
            Attendance.status.in_([AttendanceStatusEnum.hadir, AttendanceStatusEnum.telat])
        ).count()
        
        izin = db.query(LeaveRequest).filter(
            LeaveRequest.tanggal == day,
            LeaveRequest.status_approval == LeaveStatusEnum.disetujui
        ).count()
        
        alpa = max(0, total_peserta - hadir - izin)
        
        hadir_minggu_lalu += hadir
        izin_minggu_lalu += izin
        alpa_minggu_lalu += alpa
        
    kehadiran_mingguan = [
        WeeklyData(name="Hadir", value=hadir_minggu_lalu, fill="#4ade80"),
        WeeklyData(name="Izin", value=izin_minggu_lalu, fill="#60a5fa"),
        WeeklyData(name="Alpa", value=alpa_minggu_lalu, fill="#f87171"),
    ]
    
    komposisi_hari_ini = [
        CompositionData(name="Hadir", value=hadir_hari_ini, fill="#4ade80"),
        CompositionData(name="Telat", value=telat_hari_ini, fill="#fbbf24"),
        CompositionData(name="Izin", value=izin_hari_ini, fill="#60a5fa"),
        CompositionData(name="Alpa", value=alpa_hari_ini, fill="#f87171"),
    ]
    
    return AdminDashboardStats(
        total_peserta=total_peserta,
        hadir_hari_ini=hadir_hari_ini,
        telat_hari_ini=telat_hari_ini,
        izin_hari_ini=izin_hari_ini,
        alpa_hari_ini=alpa_hari_ini,
        hadir_bulan_ini=hadir_bulan_ini,
        telat_bulan_ini=telat_bulan_ini,
        izin_bulan_ini=izin_bulan_ini,
        alpa_bulan_ini=alpa_bulan_ini,
        kehadiran_mingguan=kehadiran_mingguan,
        komposisi_hari_ini=komposisi_hari_ini
    )

@router.get("/user", response_model=UserDashboardStats)
def get_user_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = get_today_wib()
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
