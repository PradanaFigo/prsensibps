from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.config import settings as app_settings
from app.database import get_db
from app.models import AppSetting
from app.schemas import SettingUpdate, SettingResponse

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/{key}", response_model=SettingResponse)
def get_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(AppSetting).filter(AppSetting.key == key).first()
    if setting:
        return SettingResponse(key=setting.key, value=setting.value)
    
    # Fallbacks
    if key == "ATTENDANCE_CUTOFF_TIME":
        return SettingResponse(key=key, value=app_settings.ATTENDANCE_CUTOFF_TIME)
    if key == "OFFICE_RADIUS_METERS":
        return SettingResponse(key=key, value=str(app_settings.OFFICE_RADIUS_METERS))
        
    raise HTTPException(status_code=404, detail="Setting not found")

@router.put("/{key}", response_model=SettingResponse)
def update_setting(key: str, payload: SettingUpdate, db: Session = Depends(get_db), admin_user = Depends(require_admin)):
    setting = db.query(AppSetting).filter(AppSetting.key == key).first()
    if setting:
        setting.value = payload.value
    else:
        setting = AppSetting(key=key, value=payload.value)
        db.add(setting)
        
    db.commit()
    db.refresh(setting)
    return SettingResponse(key=setting.key, value=setting.value)
