import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    String,
    Time,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    user = "user"


class AttendanceStatusEnum(str, enum.Enum):
    hadir = "hadir"
    telat = "telat"
    alpa = "alpa"


class LeaveTypeEnum(str, enum.Enum):
    izin = "izin"
    sakit = "sakit"


class LeaveStatusEnum(str, enum.Enum):
    pending = "pending"
    disetujui = "disetujui"
    ditolak = "ditolak"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.user)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    attendances = relationship("Attendance", back_populates="user")
    leave_requests = relationship("LeaveRequest", back_populates="user", foreign_keys="LeaveRequest.user_id")
    logbooks = relationship("Logbook", back_populates="user")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tanggal = Column(Date, nullable=False)
    
    jam_masuk = Column(Time, nullable=True)
    latitude_masuk = Column(Float, nullable=True)
    longitude_masuk = Column(Float, nullable=True)
    jarak_masuk = Column(Float, nullable=True)
    
    jam_pulang = Column(Time, nullable=True)
    latitude_pulang = Column(Float, nullable=True)
    longitude_pulang = Column(Float, nullable=True)
    jarak_pulang = Column(Float, nullable=True)
    
    status = Column(Enum(AttendanceStatusEnum), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="attendances")


class LeaveRequest(Base):
    __tablename__ = "leave_request"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tanggal = Column(Date, nullable=False)
    jenis = Column(Enum(LeaveTypeEnum), nullable=False)
    keterangan = Column(String, nullable=True)
    
    status_approval = Column(Enum(LeaveStatusEnum), default=LeaveStatusEnum.pending, nullable=False)
    diproses_oleh = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    diproses_pada = Column(DateTime, nullable=True)
    
    diajukan_pada = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="leave_requests", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[diproses_oleh])


class Logbook(Base):
    __tablename__ = "logbook"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tanggal = Column(Date, nullable=False)
    kegiatan = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="logbooks")


class OfficeLocation(Base):
    __tablename__ = "office_location"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama_lokasi = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meter = Column(Float, nullable=False, default=150)

class AppSetting(Base):
    __tablename__ = "app_settings"
    
    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=False)
