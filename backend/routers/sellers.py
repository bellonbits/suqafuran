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
    """Get all orders for the authenticated seller"""
    seller = db.query(Seller).filter(Seller.user_id == str(current_user.id)).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    query = db.query(Order).filter(Order.seller_id == seller.id)
    if status:
        query = query.filter(Order.status == status)

    orders = query.order_by(Order.created_at.desc()).limit(limit).all()

    # Format response with order items
    result = []
    for order in orders:
        from models import OrderItem
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        result.append({
            "id": order.id,
            "status": order.status,
            "payment_status": order.payment_status,
            "total_amount": order.total_amount,
            "seller_amount": order.seller_amount,
            "delivery_option": order.delivery_option,
            "delivery_address": order.delivery_address,
            "phone_number": order.phone_number,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "title": item.title,
                    "quantity": item.quantity,
                    "price": item.price
                }
                for item in items
            ],
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "updated_at": order.updated_at.isoformat() if order.updated_at else None
        })

    return result

@router.get("/me/orders/{order_id}")
def get_seller_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed view of an order"""
    from models import OrderItem

    seller = db.query(Seller).filter(Seller.user_id == str(current_user.id)).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == seller.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

    return {
        "id": order.id,
        "status": order.status,
        "payment_status": order.payment_status,
        "total_amount": order.total_amount,
        "seller_amount": order.seller_amount,
        "platform_fee": order.platform_fee,
        "courier_tip": order.courier_tip,
        "delivery_option": order.delivery_option,
        "delivery_address": order.delivery_address,
        "phone_number": order.phone_number,
        "payment_reference": order.payment_reference,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "title": item.title,
                "quantity": item.quantity,
                "price": item.price
            }
            for item in items
        ],
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None
    }

@router.patch("/me/orders/{order_id}")
def update_seller_order_status(
    order_id: str,
    status_update: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update order status - seller can move between CONFIRMED → PREPARING → READY_FOR_PICKUP"""
    seller = db.query(Seller).filter(Seller.user_id == str(current_user.id)).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == seller.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = status_update.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")

    # Validate status transitions
    valid_statuses = ["preparing", "ready_for_pickup"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Seller can only set: {', '.join(valid_statuses)}")

    # Only allow status updates for confirmed orders
    if order.status not in ["confirmed", "preparing"]:
        raise HTTPException(status_code=400, detail=f"Cannot update status from {order.status}")

    order.status = new_status
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    return {
        "id": order.id,
        "status": order.status,
        "message": f"Order status updated to {new_status}",
        "updated_at": order.updated_at.isoformat() if order.updated_at else None
    }

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

@router.get("/me/dashboard")
def get_seller_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get seller dashboard with order analytics"""
    seller = db.query(Seller).filter(Seller.user_id == str(current_user.id)).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    # Count orders by status
    pending_orders = db.query(Order).filter(
        Order.seller_id == seller.id,
        Order.status.in_(["payment_pending", "confirmed"])
    ).count()

    preparing_orders = db.query(Order).filter(
        Order.seller_id == seller.id,
        Order.status == "preparing"
    ).count()

    ready_orders = db.query(Order).filter(
        Order.seller_id == seller.id,
        Order.status == "ready_for_pickup"
    ).count()

    in_delivery_orders = db.query(Order).filter(
        Order.seller_id == seller.id,
        Order.status == "in_delivery"
    ).count()

    delivered_orders = db.query(Order).filter(
        Order.seller_id == seller.id,
        Order.status == "delivered"
    ).count()

    # Get total revenue
    completed_orders = db.query(Order).filter(
        Order.seller_id == seller.id,
        Order.status == "delivered"
    ).all()

    total_revenue = sum(order.seller_amount for order in completed_orders)

    return {
        "shop_name": seller.shop_name,
        "owner_name": seller.owner_name,
        "email": seller.email,
        "phone": seller.phone,
        "stats": {
            "pending": pending_orders,
            "preparing": preparing_orders,
            "ready_for_pickup": ready_orders,
            "in_delivery": in_delivery_orders,
            "delivered": delivered_orders,
            "total_revenue": total_revenue
        }
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

# Delivery & Rider Management

@router.get("/me/available-riders")
def get_available_riders_for_seller(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of available riders for assigning deliveries"""
    from models import Rider

    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    riders = db.query(Rider).filter(Rider.is_active == True).all()

    return [
        {
            "id": rider.id,
            "phone": rider.phone,
            "vehicle_type": rider.vehicle_type,
            "vehicle_plate": rider.vehicle_plate,
            "is_verified": rider.is_verified,
            "current_location": {
                "latitude": rider.current_lat,
                "longitude": rider.current_lng
            }
        }
        for rider in riders
    ]

@router.post("/me/orders/{order_id}/assign-rider")
def assign_rider_to_order(
    order_id: str,
    assignment_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign a rider to an order"""
    from models import Rider, DeliveryAssignment

    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == seller.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or you don't own it")

    rider_id = assignment_data.get("rider_id")
    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")

    # Check if order already has an assignment
    existing = db.query(DeliveryAssignment).filter(
        DeliveryAssignment.order_id == order_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Order already has a rider assigned")

    # Create assignment
    assignment = DeliveryAssignment(
        order_id=order_id,
        rider_id=rider_id,
        status="assigned"
    )
    db.add(assignment)
    order.status = "ready_for_pickup"
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assignment)

    return {
        "assignment_id": assignment.id,
        "order_id": assignment.order_id,
        "rider_id": assignment.rider_id,
        "rider_phone": rider.phone,
        "rider_vehicle": f"{rider.vehicle_type} ({rider.vehicle_plate})",
        "status": assignment.status,
        "message": "Rider assigned successfully",
        "created_at": assignment.created_at.isoformat()
    }

@router.get("/me/orders/{order_id}/rider")
def get_order_rider(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get assigned rider info for an order"""
    from models import Rider, DeliveryAssignment

    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == seller.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    assignment = db.query(DeliveryAssignment).filter(
        DeliveryAssignment.order_id == order_id
    ).first()

    if not assignment:
        return {"assigned": False, "message": "No rider assigned yet"}

    rider = db.query(Rider).filter(Rider.id == assignment.rider_id).first()

    return {
        "assigned": True,
        "assignment_id": assignment.id,
        "rider_id": rider.id,
        "rider_name": rider.phone,
        "vehicle_type": rider.vehicle_type,
        "vehicle_plate": rider.vehicle_plate,
        "current_location": {
            "latitude": rider.current_lat,
            "longitude": rider.current_lng
        },
        "delivery_status": assignment.status,
        "assigned_at": assignment.created_at.isoformat()
    }
