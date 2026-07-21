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


@router.post("/track/search")
def track_search(
    *,
    db: Session = Depends(deps.get_db),
    query: str,
    result_count: int = 0,
    device_type: Optional[str] = None,
    category_filter: Optional[str] = None,
    location_filter: Optional[str] = None,
    request: Request,
    current_user: Optional[User] = Depends(deps.get_current_user),
) -> Any:
    """Track search queries for marketplace analytics."""
    from app.models.analytics import SearchEvent
    
    search_event = SearchEvent(
        query=query,
        result_count=result_count,
        user_id=current_user.id if current_user else None,
        device_type=device_type,
        ip_address=request.client.host if request.client else None,
        category_filter=category_filter,
        location_filter=location_filter,
    )
    db.add(search_event)
    db.commit()
    return {"status": "ok"}


@router.post("/track/click")
def track_click(
    *,
    db: Session = Depends(deps.get_db),
    event_type: str,
    listing_id: Optional[int] = None,
    shop_id: Optional[int] = None,
    device_type: Optional[str] = None,
    request: Request,
    current_user: Optional[User] = Depends(deps.get_current_user),
) -> Any:
    """Track user clicks (chat, call, favorite, etc.)."""
    from app.models.analytics import ClickEvent
    
    click_event = ClickEvent(
        event_type=event_type,
        listing_id=listing_id,
        shop_id=shop_id,
        user_id=current_user.id if current_user else None,
        device_type=device_type,
        ip_address=request.client.host if request.client else None,
    )
    db.add(click_event)
    db.commit()
    return {"status": "ok"}


@router.post("/track/conversion")
def track_conversion(
    *,
    db: Session = Depends(deps.get_db),
    stage: str,
    listing_id: Optional[int] = None,
    shop_id: Optional[int] = None,
    device_type: Optional[str] = None,
    request: Request,
    current_user: Optional[User] = Depends(deps.get_current_user),
) -> Any:
    """Track conversion funnel events."""
    from app.models.analytics import ConversionFunnelEvent
    
    event = ConversionFunnelEvent(
        stage=stage,
        listing_id=listing_id,
        shop_id=shop_id,
        user_id=current_user.id if current_user else None,
        device_type=device_type,
        ip_address=request.client.host if request.client else None,
    )
    db.add(event)
    db.commit()
    return {"status": "ok"}


@router.get("/admin/overview")
def get_overview(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    days: int = Query(7, ge=1, le=90),
) -> Any:
    """Get overview analytics for dashboard."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.models.analytics import ItemView, ShopView, ClickEvent, SearchEvent
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Total visitors (unique users + guests by IP)
    total_item_views = db.exec(
        select(func.count(ItemView.id)).where(ItemView.viewed_at >= cutoff_date)
    ).one() or 0
    
    total_shop_views = db.exec(
        select(func.count(ShopView.id)).where(ShopView.viewed_at >= cutoff_date)
    ).one() or 0

    # Unique visitors
    unique_users = db.exec(
        select(func.count(func.distinct(ItemView.user_id))).where(
            ItemView.viewed_at >= cutoff_date, ItemView.user_id.isnot(None)
        )
    ).one() or 0

    unique_guests = db.exec(
        select(func.count(func.distinct(ItemView.ip_address))).where(
            ItemView.viewed_at >= cutoff_date, ItemView.user_id.is_(None)
        )
    ).one() or 0

    # Searches
    total_searches = db.exec(
        select(func.count(SearchEvent.id)).where(SearchEvent.searched_at >= cutoff_date)
    ).one() or 0

    # Clicks (chat, call, etc.)
    chat_clicks = db.exec(
        select(func.count(ClickEvent.id)).where(
            ClickEvent.event_type == 'chat', ClickEvent.clicked_at >= cutoff_date
        )
    ).one() or 0

    favorites = db.exec(
        select(func.count(ClickEvent.id)).where(
            ClickEvent.event_type == 'favorite', ClickEvent.clicked_at >= cutoff_date
        )
    ).one() or 0

    whatsapp_clicks = db.exec(
        select(func.count(ClickEvent.id)).where(
            ClickEvent.event_type == 'whatsapp', ClickEvent.clicked_at >= cutoff_date
        )
    ).one() or 0

    call_clicks = db.exec(
        select(func.count(ClickEvent.id)).where(
            ClickEvent.event_type == 'call', ClickEvent.clicked_at >= cutoff_date
        )
    ).one() or 0

    # Conversion rate (chats / views)
    total_views = total_item_views + total_shop_views
    conversion_rate = round((chat_clicks / total_views * 100) if total_views > 0 else 0, 2)

    return {
        "period_days": days,
        "total_visitors": unique_users + unique_guests,
        "unique_users": unique_users,
        "unique_guests": unique_guests,
        "total_item_views": total_item_views,
        "total_shop_views": total_shop_views,
        "total_views": total_views,
        "total_searches": total_searches,
        "chat_clicks": chat_clicks,
        "whatsapp_clicks": whatsapp_clicks,
        "call_clicks": call_clicks,
        "favorites_added": favorites,
        "conversion_rate": conversion_rate,
    }


@router.get("/admin/search-analytics")
def get_search_analytics(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    """Get search analytics: top searches and no-result searches."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.models.analytics import SearchEvent
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Top searches (by frequency)
    top_searches = db.exec(
        select(
            SearchEvent.query,
            func.count(SearchEvent.id).label("search_count"),
            func.avg(SearchEvent.result_count).label("avg_results"),
        )
        .where(SearchEvent.searched_at >= cutoff_date)
        .group_by(SearchEvent.query)
        .order_by(func.count(SearchEvent.id).desc())
        .limit(limit)
    ).all()

    # No-result searches
    no_results = db.exec(
        select(
            SearchEvent.query,
            func.count(SearchEvent.id).label("search_count"),
        )
        .where(
            SearchEvent.searched_at >= cutoff_date,
            SearchEvent.result_count == 0,
        )
        .group_by(SearchEvent.query)
        .order_by(func.count(SearchEvent.id).desc())
        .limit(limit)
    ).all()

    return {
        "period_days": days,
        "top_searches": [
            {
                "query": q[0],
                "search_count": q[1],
                "avg_results": round(q[2]) if q[2] else 0,
            }
            for q in top_searches
        ],
        "no_result_searches": [
            {
                "query": q[0],
                "search_count": q[1],
            }
            for q in no_results
        ],
    }


@router.get("/admin/category-analytics")
def get_category_analytics(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    """Get category performance analytics."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.models.analytics import ItemView
    from app.models.listing import Listing
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Get category stats
    results = db.exec(
        select(
            Listing.category_id,
            func.count(ItemView.id).label("view_count"),
            func.count(func.distinct(Listing.id)).label("listing_count"),
        )
        .join(ItemView, ItemView.listing_id == Listing.id)
        .where(ItemView.viewed_at >= cutoff_date)
        .group_by(Listing.category_id)
        .order_by(func.count(ItemView.id).desc())
        .limit(limit)
    ).all()

    return {
        "period_days": days,
        "categories": [
            {
                "category_id": r[0],
                "view_count": r[1],
                "listing_count": r[2],
                "ctr": round((r[1] / max(r[2], 1) * 100), 2),
            }
            for r in results
        ]
    }


@router.get("/admin/conversion-funnel")
def get_conversion_funnel(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    days: int = Query(7, ge=1, le=90),
) -> Any:
    """Get conversion funnel analytics: View -> Click -> Chat -> Contact."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.models.analytics import ItemView, ClickEvent
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Stage counts
    views = db.exec(
        select(func.count(ItemView.id)).where(ItemView.viewed_at >= cutoff_date)
    ).one() or 1

    clicks = db.exec(
        select(func.count(ClickEvent.id)).where(ClickEvent.clicked_at >= cutoff_date)
    ).one() or 0

    chats = db.exec(
        select(func.count(ClickEvent.id)).where(
            ClickEvent.event_type == 'chat', ClickEvent.clicked_at >= cutoff_date
        )
    ).one() or 0

    return {
        "period_days": days,
        "funnel": [
            {
                "stage": "Views",
                "count": views,
                "percentage": 100,
            },
            {
                "stage": "Clicks",
                "count": clicks,
                "percentage": round((clicks / views * 100), 2),
            },
            {
                "stage": "Chats Started",
                "count": chats,
                "percentage": round((chats / views * 100), 2),
            },
        ]
    }


# Phase 2: Listing, Shop, Geographic, User Analytics

@router.get("/admin/listing-stats/{listing_id}")
def get_listing_stats(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    listing_id: int,
    days: int = Query(30, ge=1, le=365),
) -> Any:
    """Get detailed stats for a specific listing."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.models.analytics import ItemView, ClickEvent

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Views
    total_views = db.exec(
        select(func.count(ItemView.id))
        .where(ItemView.listing_id == listing_id, ItemView.viewed_at >= cutoff_date)
    ).one() or 0

    unique_viewers = db.exec(
        select(func.count(func.distinct(ItemView.user_id)))
        .where(ItemView.listing_id == listing_id, ItemView.viewed_at >= cutoff_date)
    ).one() or 0

    # Clicks
    chat_clicks = db.exec(
        select(func.count(ClickEvent.id))
        .where(
            ClickEvent.listing_id == listing_id,
            ClickEvent.event_type == "chat",
            ClickEvent.clicked_at >= cutoff_date,
        )
    ).one() or 0

    favorites = db.exec(
        select(func.count(ClickEvent.id))
        .where(
            ClickEvent.listing_id == listing_id,
            ClickEvent.event_type == "favorite",
            ClickEvent.clicked_at >= cutoff_date,
        )
    ).one() or 0

    whatsapp_clicks = db.exec(
        select(func.count(ClickEvent.id))
        .where(
            ClickEvent.listing_id == listing_id,
            ClickEvent.event_type == "whatsapp",
            ClickEvent.clicked_at >= cutoff_date,
        )
    ).one() or 0

    return {
        "listing_id": listing_id,
        "period_days": days,
        "total_views": total_views,
        "unique_viewers": unique_viewers,
        "chat_clicks": chat_clicks,
        "whatsapp_clicks": whatsapp_clicks,
        "favorites": favorites,
        "engagement_rate": round((chat_clicks / total_views * 100) if total_views > 0 else 0, 2),
    }


@router.get("/admin/geographic-analytics")
def get_geographic_analytics(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    """Get visitor analytics by city/country with map coordinates."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.models.analytics import GeographicEvent

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Visitors by city
    city_stats = db.exec(
        select(
            GeographicEvent.city,
            GeographicEvent.latitude,
            GeographicEvent.longitude,
            GeographicEvent.country,
            func.count(GeographicEvent.id).label("visitor_count"),
            func.count(func.distinct(GeographicEvent.user_id)).label("unique_users"),
        )
        .where(
            GeographicEvent.created_at >= cutoff_date,
            GeographicEvent.city.isnot(None),
        )
        .group_by(
            GeographicEvent.city,
            GeographicEvent.latitude,
            GeographicEvent.longitude,
            GeographicEvent.country,
        )
        .order_by(func.count(GeographicEvent.id).desc())
        .limit(limit)
    ).all()

    # Visitors by country
    country_stats = db.exec(
        select(
            GeographicEvent.country,
            func.count(GeographicEvent.id).label("visitor_count"),
            func.count(func.distinct(GeographicEvent.user_id)).label("unique_users"),
        )
        .where(
            GeographicEvent.created_at >= cutoff_date,
            GeographicEvent.country.isnot(None),
        )
        .group_by(GeographicEvent.country)
        .order_by(func.count(GeographicEvent.id).desc())
        .limit(limit)
    ).all()

    return {
        "period_days": days,
        "cities": [
            {
                "city": c[0],
                "latitude": c[1],
                "longitude": c[2],
                "country": c[3],
                "visitor_count": c[4],
                "unique_users": c[5],
            }
            for c in city_stats
        ],
        "countries": [
            {
                "country": c[0],
                "visitor_count": c[1],
                "unique_users": c[2],
            }
            for c in country_stats
        ],
    }


@router.get("/admin/user-analytics")
def get_user_analytics(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    days: int = Query(7, ge=1, le=90),
) -> Any:
    """Get user cohort analytics: new, returning, sellers."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.models.analytics import UserCohort

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # New users (first visit in period)
    new_users = db.exec(
        select(func.count(UserCohort.id))
        .where(UserCohort.first_visit_at >= cutoff_date)
    ).one() or 0

    # Returning users (visited before period)
    returning_users = db.exec(
        select(func.count(UserCohort.id))
        .where(
            UserCohort.first_visit_at < cutoff_date,
            UserCohort.last_visit_at >= cutoff_date,
        )
    ).one() or 0

    # Active sellers
    active_sellers = db.exec(
        select(func.count(UserCohort.id))
        .where(UserCohort.is_seller == True)
    ).one() or 0

    # Verified sellers
    verified_sellers = db.exec(
        select(func.count(UserCohort.id))
        .where(UserCohort.is_seller == True, UserCohort.is_verified == True)
    ).one() or 0

    # Top users by activity
    top_users = db.exec(
        select(
            UserCohort.user_id,
            UserCohort.total_searches,
            UserCohort.total_clicks,
            UserCohort.total_chats,
            UserCohort.visit_count,
        )
        .order_by(UserCohort.total_chats.desc())
        .limit(10)
    ).all()

    return {
        "period_days": days,
        "new_users": new_users,
        "returning_users": returning_users,
        "total_active_sellers": active_sellers,
        "verified_sellers": verified_sellers,
        "top_users": [
            {
                "user_id": u[0],
                "searches": u[1],
                "clicks": u[2],
                "chats": u[3],
                "visits": u[4],
            }
            for u in top_users
        ],
    }
