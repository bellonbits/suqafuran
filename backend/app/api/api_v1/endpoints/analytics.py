"""Analytics endpoints for tracking and reporting engagement metrics."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from typing import Any, List, Optional
from app.api import deps
from app.models.analytics import ItemView, ShopView
from app.models.user import User

router = APIRouter()


@router.post("/track/item-view")
def track_item_view(
    *,
    db: Session = Depends(deps.get_db),
    listing_id: int,
    time_spent_seconds: int = 0,
    device_type: Optional[str] = None,
    referrer: Optional[str] = None,
    request: Request,
    current_user: Optional[User] = Depends(deps.get_current_user),
) -> Any:
    """Track when a user/guest views an item listing."""
    item_view = ItemView(
        listing_id=listing_id,
        user_id=current_user.id if current_user else None,
        device_type=device_type,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        time_spent_seconds=time_spent_seconds,
        referrer=referrer,
    )
    db.add(item_view)
    db.commit()
    db.refresh(item_view)
    return {"status": "ok", "view_id": item_view.id}


@router.post("/track/shop-view")
def track_shop_view(
    *,
    db: Session = Depends(deps.get_db),
    shop_owner_id: int,
    time_spent_seconds: int = 0,
    device_type: Optional[str] = None,
    referrer: Optional[str] = None,
    request: Request,
    current_user: Optional[User] = Depends(deps.get_current_user),
) -> Any:
    """Track when a user/guest views a shop profile."""
    shop_view = ShopView(
        shop_owner_id=shop_owner_id,
        user_id=current_user.id if current_user else None,
        device_type=device_type,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        time_spent_seconds=time_spent_seconds,
        referrer=referrer,
    )
    db.add(shop_view)
    db.commit()
    db.refresh(shop_view)
    return {"status": "ok", "view_id": shop_view.id}


@router.get("/admin/top-items")
def get_top_items(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    """Get top viewed items for admin dashboard."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Get top items by view count
    statement = (
        select(
            ItemView.listing_id,
            func.count(ItemView.id).label("view_count"),
            func.count(func.distinct(ItemView.user_id)).label("unique_users"),
            func.count(func.distinct(ItemView.ip_address)).label("unique_guests"),
        )
        .where(ItemView.viewed_at >= cutoff_date)
        .group_by(ItemView.listing_id)
        .order_by(func.count(ItemView.id).desc())
        .limit(limit)
    )

    results = db.exec(statement).all()

    return {
        "period_days": days,
        "items": [
            {
                "listing_id": r[0],
                "view_count": r[1],
                "unique_users": r[2],
                "unique_guests": r[3],
                "total_unique_visitors": r[2] + r[3],
            }
            for r in results
        ]
    }


@router.get("/admin/top-shops")
def get_top_shops(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    """Get top viewed shops for admin dashboard."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Get top shops by view count
    statement = (
        select(
            ShopView.shop_owner_id,
            func.count(ShopView.id).label("view_count"),
            func.count(func.distinct(ShopView.user_id)).label("unique_users"),
            func.count(func.distinct(ShopView.ip_address)).label("unique_guests"),
        )
        .where(ShopView.viewed_at >= cutoff_date)
        .group_by(ShopView.shop_owner_id)
        .order_by(func.count(ShopView.id).desc())
        .limit(limit)
    )

    results = db.exec(statement).all()

    return {
        "period_days": days,
        "shops": [
            {
                "shop_owner_id": r[0],
                "view_count": r[1],
                "unique_users": r[2],
                "unique_guests": r[3],
                "total_unique_visitors": r[2] + r[3],
            }
            for r in results
        ]
    }


@router.get("/admin/live-views")
def get_live_views(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    minutes: int = Query(5, ge=1, le=60),
) -> Any:
    """Get real-time view activity from the last N minutes."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)

    # Recent item views
    item_views = db.exec(
        select(ItemView)
        .where(ItemView.viewed_at >= cutoff_time)
        .order_by(ItemView.viewed_at.desc())
        .limit(50)
    ).all()

    # Recent shop views
    shop_views = db.exec(
        select(ShopView)
        .where(ShopView.viewed_at >= cutoff_time)
        .order_by(ShopView.viewed_at.desc())
        .limit(50)
    ).all()

    # Count totals
    item_view_count = db.exec(
        select(func.count(ItemView.id)).where(ItemView.viewed_at >= cutoff_time)
    ).one()

    shop_view_count = db.exec(
        select(func.count(ShopView.id)).where(ShopView.viewed_at >= cutoff_time)
    ).one()

    return {
        "time_window_minutes": minutes,
        "item_views_count": item_view_count,
        "shop_views_count": shop_view_count,
        "recent_item_views": [
            {
                "id": v.id,
                "listing_id": v.listing_id,
                "user_id": v.user_id,
                "device_type": v.device_type,
                "viewed_at": v.viewed_at.isoformat(),
            }
            for v in item_views
        ],
        "recent_shop_views": [
            {
                "id": v.id,
                "shop_owner_id": v.shop_owner_id,
                "user_id": v.user_id,
                "device_type": v.device_type,
                "viewed_at": v.viewed_at.isoformat(),
            }
            for v in shop_views
        ]
    }


@router.get("/admin/item-stats/{listing_id}")
def get_item_stats(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    listing_id: int,
    days: int = Query(30, ge=1, le=365),
) -> Any:
    """Get detailed stats for a specific item."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    total_views = db.exec(
        select(func.count(ItemView.id))
        .where(ItemView.listing_id == listing_id, ItemView.viewed_at >= cutoff_date)
    ).one()

    unique_users = db.exec(
        select(func.count(func.distinct(ItemView.user_id)))
        .where(ItemView.listing_id == listing_id, ItemView.viewed_at >= cutoff_date)
    ).one()

    unique_guests = db.exec(
        select(func.count(func.distinct(ItemView.ip_address)))
        .where(
            ItemView.listing_id == listing_id,
            ItemView.user_id.is_(None),
            ItemView.viewed_at >= cutoff_date,
        )
    ).one()

    avg_time_spent = db.exec(
        select(func.avg(ItemView.time_spent_seconds))
        .where(ItemView.listing_id == listing_id, ItemView.viewed_at >= cutoff_date)
    ).one()

    return {
        "listing_id": listing_id,
        "period_days": days,
        "total_views": total_views or 0,
        "unique_user_views": unique_users or 0,
        "unique_guest_views": unique_guests or 0,
        "total_unique_visitors": (unique_users or 0) + (unique_guests or 0),
        "avg_time_spent_seconds": round(avg_time_spent) if avg_time_spent else 0,
    }


@router.get("/admin/shop-stats/{shop_owner_id}")
def get_shop_stats(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    shop_owner_id: int,
    days: int = Query(30, ge=1, le=365),
) -> Any:
    """Get detailed stats for a specific shop."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    total_views = db.exec(
        select(func.count(ShopView.id))
        .where(ShopView.shop_owner_id == shop_owner_id, ShopView.viewed_at >= cutoff_date)
    ).one()

    unique_users = db.exec(
        select(func.count(func.distinct(ShopView.user_id)))
        .where(ShopView.shop_owner_id == shop_owner_id, ShopView.viewed_at >= cutoff_date)
    ).one()

    unique_guests = db.exec(
        select(func.count(func.distinct(ShopView.ip_address)))
        .where(
            ShopView.shop_owner_id == shop_owner_id,
            ShopView.user_id.is_(None),
            ShopView.viewed_at >= cutoff_date,
        )
    ).one()

    avg_time_spent = db.exec(
        select(func.avg(ShopView.time_spent_seconds))
        .where(ShopView.shop_owner_id == shop_owner_id, ShopView.viewed_at >= cutoff_date)
    ).one()

    return {
        "shop_owner_id": shop_owner_id,
        "period_days": days,
        "total_views": total_views or 0,
        "unique_user_views": unique_users or 0,
        "unique_guest_views": unique_guests or 0,
        "total_unique_visitors": (unique_users or 0) + (unique_guests or 0),
        "avg_time_spent_seconds": round(avg_time_spent) if avg_time_spent else 0,
    }
