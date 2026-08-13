import os
from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres.zjqcfsyehnftuvockati:figo021004.%21@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres')
with engine.connect() as conn:
    res = conn.execute(text('SELECT is_deleted, count(*) FROM users GROUP BY is_deleted'))
    print('USER is_deleted:', [r for r in res])
