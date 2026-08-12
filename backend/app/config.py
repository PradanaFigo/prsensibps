from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Lokasi kantor BPS
    OFFICE_LATITUDE: float
    OFFICE_LONGITUDE: float
    OFFICE_RADIUS_METERS: float = 150

    # Jam batas dianggap "Hadir" (bukan "Telat")
    ATTENDANCE_CUTOFF_TIME: str = "08:00"


    # Seed admin pertama
    SEED_ADMIN_NAME: str = "Super Admin"
    SEED_ADMIN_USERNAME: str = "admin"
    SEED_ADMIN_PASSWORD: str = "changeme123"

    class Config:
        env_file = ".env"


settings = Settings()
