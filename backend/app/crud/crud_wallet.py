from typing import List, Optional
from sqlmodel import Session, select
from app.models.wallet import Wallet, Transaction, Voucher
from datetime import datetime
import uuid

def get_wallet_by_user_id(db: Session, user_id: int) -> Optional[Wallet]:
    return db.exec(select(Wallet).where(Wallet.user_id == user_id)).first()

def create_wallet(db: Session, user_id: int) -> Wallet:
    # Check if a wallet already exists for this user
    existing_wallet = get_wallet_by_user_id(db, user_id)
    if existing_wallet:
        return existing_wallet
        
    db_wallet = Wallet(user_id=user_id)
    db.add(db_wallet)
    db.commit()
    db.refresh(db_wallet)
    return db_wallet

def deposit_funds(db: Session, wallet: Wallet, amount: float, description: str = "Deposit") -> Wallet:
    wallet.balance += amount
    wallet.updated_at = datetime.utcnow()
    
    transaction = Transaction(
        wallet_id=wallet.id,
        amount=amount,
        type="deposit",
        description=description,
        reference=str(uuid.uuid4())
    )
    
    db.add(wallet)
    db.add(transaction)
    db.commit()
    db.refresh(wallet)
    return wallet

def deduct_funds(db: Session, wallet: Wallet, amount: float, description: str, type: str = "payment") -> Optional[Wallet]:
    if wallet.balance < amount:
        return None
    
    wallet.balance -= amount
    wallet.updated_at = datetime.utcnow()
    
    transaction = Transaction(
        wallet_id=wallet.id,
        amount=-amount,
        type=type,
        description=description,
        reference=str(uuid.uuid4())
    )
    
    db.add(wallet)
    db.add(transaction)
    db.commit()
    db.refresh(wallet)
    return wallet

def get_transactions(db: Session, wallet_id: int, skip: int = 0, limit: int = 100) -> List[Transaction]:
    statement = select(Transaction).where(Transaction.wallet_id == wallet_id).order_by(Transaction.created_at.desc()).offset(skip).limit(limit)
    return db.exec(statement).all()

def get_voucher_by_code(db: Session, code: str) -> Optional[Voucher]:
    return db.exec(select(Voucher).where(Voucher.code == code)).first()

def get_all_vouchers(db: Session) -> List[Voucher]:
    return db.exec(select(Voucher).order_by(Voucher.created_at.desc())).all()

def redeem_voucher(db: Session, voucher: Voucher, user_id: int) -> Wallet:
    wallet = get_wallet_by_user_id(db, user_id=user_id)
    if not wallet:
        wallet = create_wallet(db, user_id=user_id)
    
    # Update voucher status
    voucher.is_redeemed = True
    voucher.redeemed_by_id = user_id
    voucher.redeemed_at = datetime.utcnow()
    db.add(voucher)
    
    # Deposit funds
    return deposit_funds(db, wallet=wallet, amount=voucher.amount, description=f"Voucher Recharge: {voucher.code}")

def get_total_spent(db: Session, wallet_id: int) -> float:
    """
    Calculate sum of all outgoing transactions (negative amounts).
    Focuses on 'payment' type transactions.
    """
    # Sum of all transactions where amount < 0 and type == 'payment'
    # We use abs() to return a positive number representing total spent
    statement = select(Transaction).where(
        Transaction.wallet_id == wallet_id, 
        Transaction.amount < 0,
        Transaction.type == "payment"
    )
    transactions = db.exec(statement).all()
    
    total = sum(abs(tx.amount) for tx in transactions)
    return total

def get_active_boosts_count(db: Session, user_id: int) -> int:
    """
    Count listings with active boosts for the user.
    """
    from app.models.listing import Listing
    
    # Assuming there's a Listing model with user_id and is_boosted/boost_expires_at fields
    # This is a placeholder logic - adjust based on actual Listing model structure
    try:
        # Check if Listing model exists and has necessary fields
        statement = select(Listing).where(
            Listing.user_id == user_id,
            Listing.is_boosted == True,
            Listing.boost_expires_at > datetime.utcnow()
        )
        results = db.exec(statement).all()
        return len(results)
    except Exception:
        # If Listing model or fields don't exist yet, return 0
        return 0
