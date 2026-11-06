from typing import Any, List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session
from pydantic import BaseModel
from app.api import deps
from app.models.checkout_receipt import CheckoutReceipt

router = APIRouter()


class ReceiptItemIn(BaseModel):
    listing_id: Optional[int] = None
    title: str
    price: float
    quantity: int = 1


class ReceiptCreateIn(BaseModel):
    seller_id: int
    items: List[ReceiptItemIn]
    total_amount: float


@router.post("/", response_model=CheckoutReceipt)
def create_receipt(
    payload: ReceiptCreateIn,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
) -> Any:
    receipt = CheckoutReceipt(
        buyer_id=current_user.id,
        seller_id=payload.seller_id,
        items=[item.dict() for item in payload.items],
        total_amount=payload.total_amount,
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return receipt


@router.get("/")
def get_receipts(
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
) -> Any:
    from app.models.user import User
    receipts = db.query(CheckoutReceipt).filter(
        (CheckoutReceipt.buyer_id == current_user.id) | (CheckoutReceipt.seller_id == current_user.id)
    ).order_by(CheckoutReceipt.created_at.desc()).limit(100).all()

    result = []
    for r in receipts:
        seller = db.query(User).filter(User.id == r.seller_id).first()
        buyer = db.query(User).filter(User.id == r.buyer_id).first()
        result.append({
            "id": r.id,
            "buyer_id": r.buyer_id,
            "buyer_name": buyer.full_name or buyer.username if buyer else "Buyer",
            "seller_id": r.seller_id,
            "seller_name": seller.full_name or seller.username if seller else "Seller",
            "seller_avatar": getattr(seller, "avatar_url", None) if seller else None,
            "items": r.items or [],
            "total_amount": r.total_amount,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result
