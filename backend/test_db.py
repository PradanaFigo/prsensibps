import os
from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres.zjqcfsyehnftuvockati:figo021004.%21@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres')
with engine.connect() as conn:
    res = conn.execute(text('SELECT count(*) FROM attendance'))
    print('ATTENDANCE COUNT:', [r for r in res])
    res = conn.execute(text('SELECT count(*) FROM users'))
    print('USERS COUNT:', [r for r in res])
    res = conn.execute(text('SELECT * FROM attendance LIMIT 5'))
    print('ATTENDANCE:', [r for r in res])
