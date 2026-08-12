from math import asin, cos, radians, sin, sqrt


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Menghitung jarak antara dua titik koordinat (dalam meter) menggunakan rumus Haversine."""
    R = 6371000  # radius bumi dalam meter

    lat1_r, lon1_r, lat2_r, lon2_r = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r

    a = sin(dlat / 2) ** 2 + cos(lat1_r) * cos(lat2_r) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))

    return R * c
