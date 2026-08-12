from datetime import datetime, timedelta

def get_now_wib():
    """Mengembalikan waktu saat ini dalam zona waktu WIB (UTC+7) sebagai naive datetime."""
    return datetime.utcnow() + timedelta(hours=7)

def get_today_wib():
    """Mengembalikan tanggal saat ini dalam zona waktu WIB."""
    return get_now_wib().date()
