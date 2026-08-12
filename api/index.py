import sys
import os

# Tambahkan folder backend ke dalam system path agar impor 'app.xxx' bisa terbaca oleh Python di Vercel
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app
