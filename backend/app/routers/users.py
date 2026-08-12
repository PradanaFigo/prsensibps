import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import hash_password, require_admin
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserOut, UserCreateOut

router = APIRouter(prefix="/users", tags=["Manajemen Akun (Admin)"])


def generate_temp_password() -> str:
    """Generate password sementara acak (8 karakter alfanumerik)."""
    return secrets.token_urlsafe(6)


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).filter(User.is_deleted == False).order_by(User.created_at.desc()).all()  # noqa: E712


@router.post("", response_model=UserCreateOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah terdaftar")

    temp_password = generate_temp_password()

    new_user = User(
        nama=payload.nama,
        username=payload.username,
        role=payload.role,
        password_hash=hash_password(temp_password),
        created_by=admin.id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Convert to UserCreateOut so we can attach temp_password
    response_data = UserCreateOut.model_validate(new_user)
    response_data.temp_password = temp_password
    return response_data


@router.post("/{user_id}/reset-password", response_model=UserCreateOut)
def reset_user_password(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    target = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()  # noqa: E712
    if not target:
        raise HTTPException(status_code=404, detail="Akun tidak ditemukan")

    temp_password = generate_temp_password()
    target.password_hash = hash_password(temp_password)
    db.commit()
    db.refresh(target)

    # Return the new password to Admin
    response_data = UserCreateOut.model_validate(target)
    response_data.temp_password = temp_password
    return response_data


@router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    target = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()  # noqa: E712
    if not target:
        raise HTTPException(status_code=404, detail="Akun tidak ditemukan")

    if str(target.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Tidak bisa menghapus akun sendiri")

    # Soft delete: data historis absensi/izin tetap tersimpan
    target.is_deleted = True
    db.commit()
    return {"message": f"Akun {target.nama} berhasil dihapus"}
