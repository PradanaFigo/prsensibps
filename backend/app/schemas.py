import uuid
from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel

from app.models import AttendanceStatusEnum, LeaveTypeEnum, RoleEnum, LeaveStatusEnum


# ---------- Auth ----------
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum
    nama: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


# ---------- User / Akun ----------
class UserCreate(BaseModel):
    nama: str
    username: str
    role: RoleEnum


class UserOut(BaseModel):
    id: uuid.UUID
    nama: str
    username: str
    role: RoleEnum
    is_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreateOut(UserOut):
    temp_password: Optional[str] = None


# ---------- Absensi ----------
class AttendanceCreate(BaseModel):
    latitude: float
    longitude: float


class AttendanceOut(BaseModel):
    id: uuid.UUID
    tanggal: date
    jam_masuk: Optional[time]
    jam_pulang: Optional[time]
    jarak_masuk: Optional[float]
    jarak_pulang: Optional[float]
    status: Optional[AttendanceStatusEnum]

    class Config:
        from_attributes = True


# ---------- Izin/Sakit ----------
class LeaveRequestCreate(BaseModel):
    tanggal: date
    jenis: LeaveTypeEnum
    keterangan: Optional[str] = None


class LeaveRequestOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    tanggal: date
    jenis: LeaveTypeEnum
    keterangan: Optional[str]
    status_approval: LeaveStatusEnum
    diproses_oleh: Optional[uuid.UUID]
    diproses_pada: Optional[datetime]
    diajukan_pada: datetime

    class Config:
        from_attributes = True

class LeaveApprovalRequest(BaseModel):
    status: LeaveStatusEnum

# ---------- Logbook ----------
class LogbookCreate(BaseModel):
    tanggal: date
    kegiatan: str

class LogbookUpdate(BaseModel):
    tanggal: Optional[date] = None
    kegiatan: Optional[str] = None

class LogbookOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    tanggal: date
    kegiatan: str
    created_at: datetime

    class Config:
        from_attributes = True

# ---------- Rekap ----------
class RekapRow(BaseModel):
    user_id: uuid.UUID
    nama: str
    tanggal: date
    jam_masuk: Optional[time] = None
    jam_pulang: Optional[time] = None
    status: str
    jarak_dari_kantor: Optional[float] = None
    keterangan: Optional[str] = None

class UpdateStatusRequest(BaseModel):
    user_id: uuid.UUID
    tanggal: date
    status: str

class SettingUpdate(BaseModel):
    value: str

class SettingResponse(BaseModel):
    key: str
    value: str



# ---------- Stats Dashboard ----------
class WeeklyData(BaseModel):
    name: str
    hadir: int
    izin: int
    alpa: int
    telat: int

class CompositionData(BaseModel):
    name: str
    value: int
    color: str

class AdminDashboardStats(BaseModel):
    total_peserta: int
    hadir_hari_ini: int
    telat_hari_ini: int
    izin_hari_ini: int
    alpa_hari_ini: int
    weekly_data: list[WeeklyData]
    composition_data: list[CompositionData]

class UserDashboardStats(BaseModel):
    hadir_bulan_ini: int
    telat_bulan_ini: int
    izin_bulan_ini: int
    alpa_bulan_ini: int
    weekly_data: list[WeeklyData]
    composition_data: list[CompositionData]
