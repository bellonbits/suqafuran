from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import Seller, Order, User
from schemas import SellerRegister, SellerResponse, SellerUpdate, MPesaVerification, EarningsResponse, WithdrawalRequest, WithdrawalResponse
from utils.security import get_current_user

router = APIRouter(prefix="/sellers", tags=["sellers"])

@router.post("/register", response_model=SellerResponse)
def register_seller(
    seller_data: SellerRegister,
    db: Session = Depends(get_db)
):
    existing = db.query(Seller).filter(Seller.email == seller_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered as seller")

    seller = Seller(
        user_id="temp",
        shop_name=seller_data.shop_name,
        owner_name=seller_data.owner_name,
        email=seller_data.email,
        phone=seller_data.phone,
        mpesa_number=seller_data.mpesa_number,
        shop_address=seller_data.shop_address,
        category=seller_data.category,
        location_lat=seller_data.location["latitude"],
        location_lng=seller_data.location["longitude"],
        verification_status="pending",
        is_active=True
    )
    db.add(seller)
    db.commit()
    db.refresh(seller)
    return seller

@router.get("/me", response_model=SellerResponse)
def get_seller_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")
    return seller

@router.patch("/me", response_model=SellerResponse)
def update_seller_profile(
    seller_data: SellerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    update_data = seller_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(seller, field, value)

    seller.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(seller)
    return seller

@router.post("/verify-mpesa")
def verify_mpesa_number(
    mpesa_data: MPesaVerification,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    # TODO: Implement actual M-Pesa verification logic
    seller.mpesa_number = mpesa_data.mpesa_number
    seller.mpesa_verified = True
    seller.updated_at = datetime.utcnow()
    db.commit()

    return {
        "verified": True,
        "message": "M-Pesa number verified successfully"
    }

@router.get("/me/orders")
def get_seller_orders(
    status: str = None,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    query = db.query(Order).filter(Order.seller_id == seller.id)
    if status:
        query = query.filter(Order.status == status)

    orders = query.limit(limit).all()
    return orders

@router.get("/me/orders/{order_id}")
def get_seller_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == seller.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order

@router.patch("/me/orders/{order_id}")
def update_seller_order_status(
    order_id: str,
    status_update: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == seller.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = status_update.get("status")
    if new_status:
        order.status = new_status
        order.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(order)

    return order

@router.post("/me/orders/{order_id}/confirm-payment")
def confirm_payment(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == seller.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status != "completed":
        raise HTTPException(status_code=400, detail="Payment not completed")

    order.status = "confirmed"
    order.updated_at = datetime.utcnow()
    db.commit()

    return {
        "message": "Payment confirmed",
        "mpesa_ref": order.payment_reference
    }

@router.get("/me/earnings", response_model=EarningsResponse)
def get_seller_earnings(
    period: str = "monthly",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    # Get all completed orders
    orders = db.query(Order).filter(
        Order.seller_id == seller.id,
        Order.status == "delivered"
    ).all()

    total_earnings = sum(order.seller_amount for order in orders)
    platform_fees = sum(order.platform_fee for order in orders)
    net_earnings = total_earnings - platform_fees

    transactions = [
        {
            "date": order.created_at.isoformat(),
            "amount": order.seller_amount,
            "order_id": order.id
        }
        for order in orders
    ]

    return {
        "total_earnings": total_earnings,
        "platform_fees": platform_fees,
        "net_earnings": net_earnings,
        "transactions": transactions
    }

@router.post("/me/withdrawals", response_model=WithdrawalResponse)
def request_withdrawal(
    withdrawal_data: WithdrawalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    # TODO: Implement withdrawal logic
    return {
        "id": f"withdrawal_{datetime.utcnow().timestamp()}",
        "amount": withdrawal_data.amount,
        "status": "pending",
        "message": "Withdrawal request submitted. You will receive the amount within 24 hours."
    }

@router.get("/me/withdrawals")
def get_withdrawal_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    # TODO: Implement withdrawal history retrieval
    return []
