from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, Depends, Body, HTTPException
from sqlmodel import Session
from pydantic import BaseModel
from app.api import deps
from app.models.mobile_money import MobileTransaction
from app.services.payment_service import payment_service

router = APIRouter()

class PaymentWebhookPayload(BaseModel):
    reference: str
    amount: float
    currency: Optional[str] = "USD"
    phone: str
    timestamp: Optional[datetime] = None

@router.post("/webhook")
def receive_payment_webhook(
    payload: PaymentWebhookPayload,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Receive payment notification from Mobile Money Provider (Simulated Webhook).
    """
    # 1. Check if transaction already exists
    existing = db.query(MobileTransaction).filter(MobileTransaction.reference == payload.reference).first()
    if existing:
        return {"status": "ignored", "detail": "Transaction already processed"}

    # 2. Create Transaction Record
    transaction = MobileTransaction(
        phone=payload.phone,
        amount=payload.amount,
        currency=payload.currency or "USD",
        reference=payload.reference,
        timestamp=payload.timestamp or datetime.utcnow(),
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    # 3. Attempt to Match
    matched_order = payment_service.match_transaction(db, transaction)

    return {
        "status": "success",
        "processed": True,
        "matched": bool(matched_order),
        "order_id": matched_order.id if matched_order else None
    }

@router.post("/simulate")
def simulate_payment(
    payload: PaymentWebhookPayload,
    db: Session = Depends(deps.get_db),
    # current_user: User = Depends(deps.get_current_active_superuser), # Optional: restrict to admin?
) -> Any:
    """
    Dev Tool: Simulate a payment reception to test auto-matching.
    """
    # Add [SIM] prefix to reference if not present to avoid collisions
    if not payload.reference.startswith("SIM-"):
        payload.reference = f"SIM-{payload.reference}"
    
    return receive_payment_webhook(payload, db)
