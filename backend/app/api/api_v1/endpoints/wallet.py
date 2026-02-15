from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api import deps
from app.crud import crud_wallet
from app.models.wallet import Wallet, Transaction
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class DepositRequest(BaseModel):
    amount: float
    description: str = "Deposit"

@router.get("/balance", response_model=dict)
def get_balance(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user's wallet balance.
    """
    wallet = crud_wallet.get_wallet_by_user_id(db, user_id=current_user.id)
    if not wallet:
        # Lazy create wallet if it doesn't exist
        wallet = crud_wallet.create_wallet(db, user_id=current_user.id)
    
    return {
        "balance": wallet.balance,
        "currency": wallet.currency,
        "updated_at": wallet.updated_at
    }

@router.get("/transactions", response_model=List[Transaction])
def get_transactions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get current user's wallet transactions.
    """
    wallet = crud_wallet.get_wallet_by_user_id(db, user_id=current_user.id)
    if not wallet:
        wallet = crud_wallet.create_wallet(db, user_id=current_user.id)
    
    return crud_wallet.get_transactions(db, wallet_id=wallet.id, skip=skip, limit=limit)

@router.post("/deposit", response_model=dict)
def deposit(
    *,
    db: Session = Depends(deps.get_db),
    deposit_in: DepositRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Deposit funds into user wallet (Mock).
    """
    if deposit_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    wallet = crud_wallet.get_wallet_by_user_id(db, user_id=current_user.id)
    if not wallet:
        wallet = crud_wallet.create_wallet(db, user_id=current_user.id)
    
    crud_wallet.deposit_funds(db, wallet=wallet, amount=deposit_in.amount, description=deposit_in.description)
    
    return {"message": "Deposit successful", "new_balance": wallet.balance}
