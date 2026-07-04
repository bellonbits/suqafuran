from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional

from config import settings
from database import engine, get_db, Base
from models import User
from schemas import (
    UserSignup, UserLogin, TokenResponse,
    OrderCreate, OrderResponse, OrderStatusUpdate, RatingSubmit, IssueReport,
    SellerRegister, SellerResponse
)
from routers import payments, sellers, riders, notifications, websocket_routes, ratings, delivery_tracking, rider_endpoints
from utils.security import get_current_user, hash_password, verify_password, create_access_token
from models import Order, OrderItem, Issue, Seller
from app.api.api_v1.api import api_router

# Create tables (comment out if database already set up)
# Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Suqafuran Marketplace API"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(api_router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(sellers.router, prefix="/api/v1")
app.include_router(riders.router, prefix="/api/v1")
app.include_router(ratings.router, prefix="/api/v1")
app.include_router(delivery_tracking.router)
app.include_router(rider_endpoints.router)
app.include_router(notifications.router)
app.include_router(websocket_routes.router)


# Auth Routes
@app.post("/api/v1/auth/signup", response_model=TokenResponse)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user_data.email,
        phone=user_data.phone,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name
        }
    }

@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

# Order Routes
@app.post("/api/v1/orders", response_model=OrderResponse)
def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate fees (10% platform fee)
    subtotal = sum(item.price * item.quantity for item in order_data.items)
    platform_fee = subtotal * 0.10
    total_amount = subtotal + platform_fee + order_data.courier_tip
    seller_amount = subtotal  # Seller gets net price
    
    # Create order
    new_order = Order(
        user_id=current_user.id,
        seller_id="temp-seller-id",  # Will be updated based on products
        status="payment_pending",
        delivery_option=order_data.delivery_option,
        delivery_address=order_data.delivery_address,
        phone_number=order_data.phone_number,
        total_amount=total_amount,
        platform_fee=platform_fee,
        seller_amount=seller_amount,
        courier_tip=order_data.courier_tip,
        location_lat=order_data.location["latitude"],
        location_lng=order_data.location["longitude"]
    )
    
    db.add(new_order)
    db.flush()
    
    # Add items
    for item in order_data.items:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            title=item.title,
            quantity=item.quantity,
            price=item.price
        )
        db.add(order_item)
    
    db.commit()
    db.refresh(new_order)
    
    return {
        "id": new_order.id,
        "user_id": new_order.user_id,
        "seller_id": new_order.seller_id,
        "status": new_order.status,
        "delivery_option": new_order.delivery_option,
        "delivery_address": new_order.delivery_address,
        "phone_number": new_order.phone_number,
        "total_amount": new_order.total_amount,
        "platform_fee": new_order.platform_fee,
        "seller_amount": new_order.seller_amount,
        "courier_tip": new_order.courier_tip,
        "payment_status": new_order.payment_status,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "title": item.title,
                "quantity": item.quantity,
                "price": item.price
            }
            for item in new_order.items
        ],
        "created_at": new_order.created_at,
        "updated_at": new_order.updated_at
    }

@app.get("/api/v1/orders")
def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
    status: Optional[str] = None
):
    query = db.query(Order).filter(Order.user_id == current_user.id)
    if status:
        query = query.filter(Order.status == status)
    orders = query.limit(limit).all()
    return orders

@app.get("/api/v1/orders/{order_id}")
def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.post("/api/v1/orders/{order_id}/rate-delivery")
def rate_delivery(
    order_id: str,
    rating: RatingSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Rating submitted successfully"}

@app.post("/api/v1/orders/{order_id}/report-issue")
def report_issue(
    order_id: str,
    issue: IssueReport,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    new_issue = Issue(
        order_id=order_id,
        issue_type=issue.issue_type,
        description=issue.description,
        status="under_review"
    )
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    
    return {
        "issue_id": new_issue.id,
        "status": new_issue.status,
        "created_at": new_issue.created_at
    }

# Seller Routes
@app.post("/api/v1/sellers/register", response_model=SellerResponse)
def register_seller(
    seller_data: SellerRegister,
    db: Session = Depends(get_db)
):
    existing_seller = db.query(Seller).filter(Seller.email == seller_data.email).first()
    if existing_seller:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_seller = Seller(
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
        verification_status="pending"
    )
    db.add(new_seller)
    db.commit()
    db.refresh(new_seller)
    
    return new_seller

@app.get("/api/v1/sellers/me", response_model=SellerResponse)
def get_seller_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")
    return seller

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
