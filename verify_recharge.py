import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.db.session import SessionLocal
from sqlalchemy import text

def create_test_voucher():
    with SessionLocal() as db:
        db.execute(text("INSERT INTO voucher (code, amount, is_redeemed, created_at) VALUES ('TEST-1234', 1000.0, false, now()) ON CONFLICT (code) DO NOTHING"))
        db.commit()
        print("Voucher TEST-1234 ensured in database.")

if __name__ == "__main__":
    create_test_voucher()
