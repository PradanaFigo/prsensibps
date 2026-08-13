import requests
res = requests.post("https://presensi-bps-jakut.vercel.app/api/auth/login", data={"username": "admin", "password": "changeme123"})
if res.status_code == 200:
    token = res.json()["access_token"]
    stats = requests.get("https://presensi-bps-jakut.vercel.app/api/stats/admin", headers={"Authorization": f"Bearer {token}"})
    print(stats.json())
else:
    print(res.text)
