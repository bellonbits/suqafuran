from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/v1/sellers", tags=["sellers"])


@router.get("/me/dashboard")
def get_seller_dashboard():
    """Get seller dashboard with sales and stats"""
    return {
        "today_sales": 5420.00,
        "orders_this_week": 12,
        "average_rating": 4.7,
        "completion_rate_percent": 97.5,
        "total_orders": 342,
        "total_revenue": 125640.00,
        "pending_orders": 3,
        "next_order": {
            "order_id": "ORD-12345",
            "customer": "John Doe",
            "items_count": 2,
            "total_amount": 1250.00,
            "status": "pending"
        },
        "store_status": "open"
    }


@router.get("/me/orders")
def get_seller_orders(limit: int = 10, offset: int = 0, status: str = None):
    """Get seller's orders"""
    return {
        "total": 342,
        "limit": limit,
        "offset": offset,
        "orders": [
            {
                "order_id": f"ORD-{1000+i}",
                "customer_name": f"Customer {i}",
                "phone": f"0712345{67+i}",
                "items_count": 1 + (i % 3),
                "total_amount": 500 + i * 100,
                "status": ["pending", "confirmed", "preparing", "ready_for_pickup", "picked_up"][i % 5],
                "created_at": datetime.utcnow().isoformat(),
                "delivery_address": f"{100+i} Main St, Nairobi"
            }
            for i in range(min(limit, 342 - offset))
        ]
    }


@router.get("/me/profile")
def get_seller_profile():
    """Get seller profile information"""
    return {
        "id": "seller_1",
        "shop_name": "My Store",
        "owner_name": "John Smith",
        "email": "seller@example.com",
        "phone": "0712345678",
        "shop_address": "123 Shop Street, Nairobi",
        "category": "General Store",
        "location": {"lat": -1.2921, "lng": 36.8219},
        "verification_status": "verified",
        "is_open": True,
        "rating": 4.7,
        "total_reviews": 145,
        "created_at": datetime.utcnow().isoformat(),
        "mpesa_number": "0712345678"
    }
