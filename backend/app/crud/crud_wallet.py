from typing import List, Optional
from sqlmodel import Session, select
from app.models.wallet import Wallet, Transaction
from datetime import datetime
import uuid

def get_wallet_by_user_id(db: Session, user_id: int) -> Optional[Wallet]:
    return db.exec(select(Wallet).where(Wallet.user_id == user_id)).first()

def create_wallet(db: Session, user_id: int) -> Wallet:
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
