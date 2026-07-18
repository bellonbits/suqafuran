"""Analytics endpoints for admin dashboard."""

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func, desc
from datetime import datetime, timedelta
from typing import Optional
from app.api import deps
from app.models.analytics import UserSession, UserActivity, ConversionFunnel, ClickEvent
from app.core.config import settings

router = APIRouter()


# ────────────────────────────────────────────────────────────────────────────
# ACTIVE SESSIONS
# ────────────────────────────────────────────────────────────────────────────

@router.get("/sessions/active")
async def get_active_sessions(
    db: Session = Depends(deps.get_db),
    limit: int = Query(50, ge=1, le=500),
):
    """Get currently active user sessions."""

    # Sessions active in last 5 minutes
    cutoff = datetime.utcnow() - timedelta(minutes=5)

    sessions = db.exec(
        select(UserSession)
        .where(UserSession.is_active == True)
        .where(UserSession.last_activity_at >= cutoff)
        .order_by(desc(UserSession.last_activity_at))
        .limit(limit)
    ).all()

    return {
        "total": len(sessions),
        "sessions": [
            {
                "session_id": s.id,
                "user_id": s.user_id,
                "started_at": s.started_at,
                "last_activity_at": s.last_activity_at,
                "current_page": s.current_page,
                "duration_minutes": (datetime.utcnow() - s.started_at).seconds // 60,
                "device_type": s.device_type,
                "total_interactions": s.total_interactions,
            }
            for s in sessions
        ]
    }


# ────────────────────────────────────────────────────────────────────────────
# USER ACTIVITY FEED
# ────────────────────────────────────────────────────────────────────────────

@router.get("/activities/feed")
async def get_activity_feed(
    db: Session = Depends(deps.get_db),
    limit: int = Query(100, ge=1, le=500),
    hours: int = Query(24, ge=1, le=720),
):
    """Get real-time user activity feed."""

    cutoff = datetime.utcnow() - timedelta(hours=hours)

    activities = db.exec(
        select(UserActivity)
        .where(UserActivity.timestamp >= cutoff)
        .order_by(desc(UserActivity.timestamp))
        .limit(limit)
    ).all()

    return {
        "total": len(activities),
        "activities": [
            {
                "activity_id": a.id,
                "user_id": a.user_id,
                "action_type": a.action_type,
                "action_category": a.action_category,
                "resource_id": a.resource_id,
                "timestamp": a.timestamp.isoformat(),
                "page_url": a.page_url,
                "search_query": a.search_query,
            }
            for a in activities
        ]
    }


# ────────────────────────────────────────────────────────────────────────────
# CONVERSION FUNNEL
# ────────────────────────────────────────────────────────────────────────────

@router.get("/funnel/stats")
async def get_funnel_stats(
    db: Session = Depends(deps.get_db),
    days: int = Query(30, ge=1, le=365),
):
    """Get conversion funnel statistics."""

    return {
        "period_days": days,
        "funnel": {
            "signup": {
                "count": 0,
                "percentage": 100,
            },
            "search": {
                "count": 0,
                "percentage": 0,
            },
            "view": {
                "count": 0,
                "percentage": 0,
            },
            "purchase": {
                "count": 0,
                "percentage": 0,
            },
        }
    }


# ────────────────────────────────────────────────────────────────────────────
# AUDIT LOG VIEWER
# ────────────────────────────────────────────────────────────────────────────

@router.get("/audit/logs")
async def get_audit_logs(
    db: Session = Depends(deps.get_db),
    user_id: Optional[int] = Query(None),
    action_type: Optional[str] = Query(None),
    action_category: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    """Get searchable audit logs."""

    query = select(UserActivity)

    if user_id:
        query = query.where(UserActivity.user_id == user_id)
    if action_type:
        query = query.where(UserActivity.action_type == action_type)
    if action_category:
        query = query.where(UserActivity.action_category == action_category)
    if start_date:
        query = query.where(UserActivity.timestamp >= start_date)
    if end_date:
        query = query.where(UserActivity.timestamp <= end_date)

    logs = db.exec(
        query
        .order_by(desc(UserActivity.timestamp))
        .limit(limit)
    ).all()

    return {
        "total": len(logs),
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action_type": log.action_type,
                "action_category": log.action_category,
                "resource_id": log.resource_id,
                "timestamp": log.timestamp.isoformat(),
                "page_url": log.page_url,
            }
            for log in logs
        ]
    }


# ────────────────────────────────────────────────────────────────────────────
# CLICK HEATMAP DATA
# ────────────────────────────────────────────────────────────────────────────

@router.get("/heatmap/data")
async def get_heatmap_data(
    db: Session = Depends(deps.get_db),
    page_url: str = Query(...),
    hours: int = Query(24, ge=1, le=720),
):
    """Get click heatmap data for a specific page."""

    cutoff = datetime.utcnow() - timedelta(hours=hours)

    clicks = db.exec(
        select(ClickEvent)
        .where(ClickEvent.page_url == page_url)
        .where(ClickEvent.timestamp >= cutoff)
        .order_by(desc(ClickEvent.timestamp))
    ).all()

    return {
        "page_url": page_url,
        "total_clicks": len(clicks),
        "clicks": [
            {
                "x": c.x,
                "y": c.y,
                "element_id": c.element_id,
                "element_type": c.element_type,
                "text": c.text,
            }
            for c in clicks
        ]
    }
