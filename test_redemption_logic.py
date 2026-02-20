import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.db.session import SessionLocal
from backend.app.crud import crud_wallet
from backend.app.models.wallet import Voucher
from sqlmodel import Session, select

def test_redemption_logic():
    user_id = 1 # Assuming user 1 exists
    code = "TEST-1234"
    
    with Session(SessionLocal()) as db:
        # 1. Fetch the voucher we seeded
        voucher = db.exec(select(Voucher).where(Voucher.code == code)).first()
        if not voucher:
             print("Voucher not found!")
             return
        
        print(f"Initial Voucher State: is_redeemed={voucher.is_redeemed}")
        
        wallet = crud_wallet.get_wallet_by_user_id(db, user_id=user_id)
        if not wallet:
             wallet = crud_wallet.create_wallet(db, user_id=user_id)
        
        initial_balance = wallet.balance
        print(f"Initial Wallet Balance: {initial_balance}")
        
        # 2. Redeem
        try:
            updated_wallet = crud_wallet.redeem_voucher(db, voucher=voucher, user_id=user_id)
            print(f"Redemption successful!")
            print(f"New Wallet Balance: {updated_wallet.balance}")
            print(f"Voucher is_redeemed: {voucher.is_redeemed}")
            print(f"Voucher redeemed_by_id: {voucher.redeemed_by_id}")
            
            # Verify balance increase
            expected_balance = initial_balance + 1000.0
            if updated_wallet.balance == expected_balance:
                print("VERIFICATION SUCCESS: Balance updated correctly.")
            else:
                print(f"VERIFICATION FAILURE: Expected balance {expected_balance}, got {updated_wallet.balance}")
                
        except Exception as e:
            print(f"Redemption failed with error: {e}")

if __name__ == "__main__":
    test_redemption_logic()
