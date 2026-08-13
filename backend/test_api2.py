import requests
res = requests.post("https://presensi-bps-jakut.vercel.app/api/auth/login", json={"username": "admin", "password": "changeme123"})
if res.status_code == 200:
    token = res.json()["access_token"]
    stats = requests.get("https://presensi-bps-jakut.vercel.app/api/stats/admin", headers={"Authorization": f"Bearer {token}"})
    print("STATUS:", stats.status_code)
    print(stats.text)
else:
    print("LOGIN FAILED:", res.status_code, res.text)
