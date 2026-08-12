# Absensi Magang BPS

Sistem absensi magang dengan validasi lokasi (GPS), dua role (admin & user), dan rekap yang bisa di-export ke Excel.

## Struktur Project

```
absensi-bps/
├── backend/          # FastAPI
│   ├── app/
│   │   ├── main.py           # entry point
│   │   ├── config.py         # baca environment variable
│   │   ├── database.py       # koneksi PostgreSQL (SQLAlchemy)
│   │   ├── models.py         # tabel: users, attendance, leave_request, office_location
│   │   ├── schemas.py        # skema request/response (Pydantic)
│   │   ├── auth.py           # JWT, hashing password
│   │   ├── routers/
│   │   │   ├── auth.py       # login, ganti password
│   │   │   ├── users.py      # manajemen akun (admin)
│   │   │   ├── attendance.py # absen + validasi lokasi
│   │   │   ├── leave.py      # ajukan izin/sakit
│   │   │   └── recap.py      # rekap + export excel
│   │   └── utils/
│   │       └── geo.py        # haversine
│   ├── seed_admin.py         # buat admin pertama
│   ├── requirements.txt
│   └── .env.example
└── frontend/          # React (Vite)
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   └── UserDashboard.jsx
    │   ├── components/ProtectedRoute.jsx
    │   ├── api/client.js
    │   └── App.jsx
    └── .env.example
```

## Cara Menjalankan Backend

1. Masuk folder backend, buat virtual environment:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Buat database PostgreSQL lewat PgAdmin, misal nama `absensi_bps`.

3. Copy `.env.example` jadi `.env`, isi sesuai konfigurasi kamu:
   - `DATABASE_URL` → connection string ke database yang dibuat di PgAdmin
   - `SECRET_KEY` → string acak untuk JWT (jangan pakai contoh di file)
   - `OFFICE_LATITUDE`, `OFFICE_LONGITUDE`, `OFFICE_RADIUS_METERS` → koordinat & radius kantor BPS
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` → kredensial admin pertama

4. Jalankan seeder untuk membuat admin pertama:
   ```
   python seed_admin.py
   ```

5. Jalankan server:
   ```
   uvicorn app.main:app --reload
   ```
   API akan jalan di `http://localhost:8000`. Dokumentasi otomatis tersedia di `http://localhost:8000/docs`.

## Cara Menjalankan Frontend

1. Masuk folder frontend, install dependency:
   ```
   cd frontend
   npm install
   ```

2. Copy `.env.example` jadi `.env`, sesuaikan `VITE_API_BASE_URL` dengan alamat backend.

3. Jalankan:
   ```
   npm run dev
   ```
   Frontend akan jalan di `http://localhost:5173`.

## Alur Pemakaian

1. Jalankan `seed_admin.py` sekali di awal → admin pertama otomatis dibuat
2. Login sebagai admin pertama di `/login`
3. Admin buat akun admin lain / user (peserta magang) lewat menu Manajemen Akun → password sementara akan muncul di layar admin untuk diberikan kepada user.
4. User login, bisa absen (dengan validasi lokasi GPS), ajukan izin/sakit, dan ganti password kapan saja
5. Admin bisa lihat & export rekap absensi per periode ke Excel

## Catatan Pengembangan Lanjutan

- Saat ini pembuatan tabel pakai `Base.metadata.create_all()` (otomatis, cocok untuk skala kecil). Untuk produksi/skala besar, sebaiknya migrasi ke Alembic supaya perubahan skema lebih terkontrol.
- CORS saat ini dibuka untuk semua origin (`allow_origins=["*"]`) — ganti ke domain frontend yang spesifik saat deploy ke produksi.
- Belum ada aturan resmi untuk kasus user mengajukan izin/sakit di tanggal yang sama dengan mencoba absen GPS — masih perlu diputuskan sesuai kebutuhan.
