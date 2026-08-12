from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import attendance, auth, leave, recap, users, logbook, stats, settings

# Membuat semua tabel jika belum ada (untuk skala kecil; gunakan Alembic untuk migrasi produksi)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Absensi Magang BPS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ganti dengan domain frontend saat produksi
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(attendance.router)
app.include_router(leave.router)
app.include_router(recap.router)
app.include_router(logbook.router)
app.include_router(stats.router)
app.include_router(settings.router)


@app.get("/")
def root():
    return {"message": "Absensi Magang BPS API berjalan"}
