import psycopg2
import os
from urllib.parse import urlparse

# Manual DB config from .env if needed, but let's try to construct URL
# POSTGRES_SERVER=pg-27a6ed6a-lymwa519-0171.k.aivencloud.com
# POSTGRES_USER=avnadmin
# POSTGRES_PASSWORD=AVNS_VhxnhYRqZ0hN_5ezNt-
# POSTGRES_DB=defaultdb
# POSTGRES_PORT=23236

dsn = "postgresql://avnadmin:AVNS_VhxnhYRqZ0hN_5ezNt-@pg-27a6ed6a-lymwa519-0171.k.aivencloud.com:23236/defaultdb?sslmode=require"

try:
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    cur.execute("INSERT INTO voucher (code, amount, is_redeemed, created_at) VALUES ('TEST-1234', 1000.0, false, now()) ON CONFLICT (code) DO NOTHING")
    conn.commit()
    print("Voucher TEST-1234 ensured in database via psycopg2.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
