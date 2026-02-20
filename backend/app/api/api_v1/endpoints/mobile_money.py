import logging
import sys
import json
from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, Depends, Body, HTTPException, Request
from sqlmodel import Session
from pydantic import BaseModel
from app.api import deps
from app.models.mobile_money import MobileTransaction
from app.models.promotion import Promotion, PromotionStatus
from app.services.payment_service import payment_service
from app.services.cache_service import cache

logger = logging.getLogger(__name__)

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
    Receive payment notification from Mobile Money Provider.
    Idempotent: duplicate references within 24h are silently ignored.
    """
    # 1. Idempotency check — Redis-level guard (fast path)
    if cache.is_duplicate("mobile_webhook", payload.reference, ttl=86400):
        return {"status": "ignored", "detail": "Already processed"}

    # 2. DB-level guard — unique index on reference handles provider retries
    existing = db.query(MobileTransaction).filter(
        MobileTransaction.reference == payload.reference
    ).first()
    if existing:
        return {"status": "ignored", "detail": "Transaction already processed"}

    # 3. Create Transaction Record
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

    # 4. Attempt to Match
    matched_order = payment_service.match_transaction(db, transaction)

    return {
        "status": "success",
        "processed": True,
        "matched": bool(matched_order),
        "order_id": matched_order.id if matched_order else None
    }

@router.post("/lipana/webhook")
async def receive_lipana_webhook(
    request: Request,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Secure webhook for Lipana M-Pesa.
    Verifies X-Lipana-Signature and processes successful transactions.
    """
    from app.services.lipana import verify_webhook_signature
    
    # 1. Get raw body and signature
    raw_body = await request.body()
    signature = request.headers.get("X-Lipana-Signature") or ""
    
    # 2. Verify Signature
    if not verify_webhook_signature(raw_body, signature):
        print(f"WEBHOOK ERROR: Invalid signature. Header: {signature}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=401, detail="Invalid signature")

    # 3. Parse Payload
    try:
        payload = json.loads(raw_body)
        print(f"WEBHOOK RECEIVED: {json.dumps(payload, indent=2)}", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"WEBHOOK ERROR: JSON parse failed: {e}. Body: {raw_body}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # 4. Check Event Type
    event = payload.get("event")
    if event != "transaction.success":
        print(f"WEBHOOK IGNORED: Event is {event}", file=sys.stderr, flush=True)
        return {"status": "ignored", "reason": f"Event is {event}"}

    # 5. Extract Data (Official spec uses flat JSON with underscores)
    tx_id = payload.get("transaction_id")
    phone = payload.get("phone")
    amount = payload.get("amount")
    reference = payload.get("reference")

    if not all([tx_id, phone, amount]):
        # Fallback check for alternate/old formats if necessary
        data = payload.get("data", {})
        tx_id = tx_id or payload.get("transactionId") or data.get("transactionId")
        phone = phone or data.get("phone") or data.get("phoneNumber")
        amount = amount or data.get("amount")
        reference = reference or data.get("reference") or tx_id

    if not all([tx_id, phone, amount]):
        return {"status": "error", "message": "Missing required fields (transaction_id, phone, amount)"}

    # 6. Idempotency Guard (Redis)
    if cache.is_duplicate("lipana_webhook", tx_id, ttl=86400):
        return {"status": "ignored", "detail": "Already processed"}

    # 7. DB Guard (Duplicate check)
    existing = db.query(MobileTransaction).filter(
        MobileTransaction.reference == tx_id
    ).first()
    if existing:
        return {"status": "ignored", "detail": "Transaction already recorded"}

    # 8. Create internal transaction record
    transaction = MobileTransaction(
        phone=str(phone),
        amount=float(amount),
        currency="KES", # Lipana KES
        reference=tx_id,
        timestamp=datetime.utcnow(),
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    # 9. Trigger auto-matching
    print(f"WEBHOOK MATCHING: Looking for Promo with lipana_tx_id={tx_id} or matching Phone={phone}, Amount={amount} or Reference={reference}", file=sys.stderr, flush=True)
    
    # Priority 1: Direct match by "Promo X" reference
    matched_order = None
    if reference and str(reference).startswith("Promo "):
        try:
            promo_id_str = str(reference).replace("Promo ", "").strip()
            promo_id = int(promo_id_str)
            print(f"WEBHOOK: Parsed Promo ID {promo_id} from reference {reference}", file=sys.stderr, flush=True)
            promo = db.get(Promotion, promo_id)
            if promo and promo.status == PromotionStatus.WAITING_FOR_PAYMENT:
                print(f"WEBHOOK: Direct match found for Promo #{promo_id}", file=sys.stderr, flush=True)
                matched_order = promo
                # Use PaymentService to activate (handles listing boost etc)
                payment_service._activate_promotion(db, promo, transaction)
        except Exception as e:
            print(f"WEBHOOK ERROR: Reference matching failed for {reference}: {e}", file=sys.stderr, flush=True)

    # Priority 2: Fallback to existing PaymentService logic (hex ID / Phone / Amount)
    if not matched_order:
        matched_order = payment_service.match_transaction(db, transaction)
    
    print(f"WEBHOOK RESULT: {'SUCCESS - Matched Promo #' + str(matched_order.id) if matched_order else 'FAILED - No Match found'}", file=sys.stderr, flush=True)

    return {
        "status": "success",
        "transaction_id": tx_id,
        "matched": bool(matched_order)
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
