from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.marketing import EmailPreference, SavedSearch, UserLifecycleStage
from app.models.campaign_send_log import CampaignSendLog
from app.services.marketing_service import marketing_service
from app.services.marketing_sms_service import marketing_sms_service
from app.core.logging_config import get_logger

logger = get_logger("marketing_api")

router = APIRouter(prefix="/marketing", tags=["marketing"])


@router.get("/email-preferences")
async def get_email_preferences(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Get user's email preferences."""
    preference = session.query(EmailPreference).filter(
        EmailPreference.user_id == current_user.id
    ).first()
    
    if not preference:
        # Create default preferences
        preference = EmailPreference(user_id=current_user.id)
        session.add(preference)
        session.commit()
    
    return preference


@router.put("/email-preferences")
async def update_email_preferences(
    data: dict,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Update user's email preferences."""
    preference = session.query(EmailPreference).filter(
        EmailPreference.user_id == current_user.id
    ).first()
    
    if not preference:
        preference = EmailPreference(user_id=current_user.id)
        session.add(preference)
    
    # Update fields
    for key, value in data.items():
        if hasattr(preference, key):
            setattr(preference, key, value)
    
    session.add(preference)
    session.commit()
    
    return {"status": "preferences updated"}


@router.post("/saved-search")
async def create_saved_search(
    data: dict,  # { "search_query": "iPhone", "category_id": 1, "min_price": 10000, "max_price": 50000 }
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Save a search for future email alerts."""
    saved_search = SavedSearch(
        user_id=current_user.id,
        search_query=data.get("search_query"),
        category_id=data.get("category_id"),
        min_price=data.get("min_price"),
        max_price=data.get("max_price"),
        location=data.get("location"),
    )
    session.add(saved_search)
    session.commit()
    
    logger.info(f"User {current_user.id} saved search: {data.get('search_query')}")
    
    return {"id": saved_search.id, "status": "saved"}


@router.get("/saved-searches")
async def get_saved_searches(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Get user's saved searches."""
    searches = session.query(SavedSearch).filter(
        SavedSearch.user_id == current_user.id
    ).all()
    
    return searches


@router.delete("/saved-search/{search_id}")
async def delete_saved_search(
    search_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Delete a saved search."""
    search = session.query(SavedSearch).filter(
        SavedSearch.id == search_id,
        SavedSearch.user_id == current_user.id
    ).first()
    
    if not search:
        raise HTTPException(status_code=404, detail="Saved search not found")
    
    session.delete(search)
    session.commit()
    
    return {"status": "deleted"}


@router.get("/user-lifecycle")
async def get_user_lifecycle(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Get user's lifecycle stage and stats."""
    lifecycle = session.query(UserLifecycleStage).filter(
        UserLifecycleStage.user_id == current_user.id
    ).first()
    
    if not lifecycle:
        return {"stage": "signup", "days_since_signup": 0}
    
    return lifecycle


# ==============================================================================
# MARKETING SMS RECOMMENDATION ENDPOINTS
# ==============================================================================

@router.get("/sms/recommendations/preview/{user_id}")
async def preview_sms_recommendations(
    user_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Preview the personalized SMS recommendation payload for any user without sending.
    Only accessible to administrators.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = marketing_sms_service.get_user_interest_profile(session, user_id)
    recommendations = marketing_sms_service.find_recommendations(session, user, limit=2)
    sms_text = marketing_sms_service.compose_sms(user, recommendations)
    is_eligible = marketing_sms_service.is_eligible_for_sms(session, user)
    is_opted_out = marketing_sms_service.is_opted_out(session, user)

    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "phone": user.phone,
        "is_eligible": is_eligible,
        "is_opted_out": is_opted_out,
        "sms_notifications_flag": user.sms_notifications,
        "interest_profile": profile,
        "recommendations": [
            {
                "id": r.id,
                "title_en": r.title_en,
                "title_so": r.title_so,
                "price": r.price,
                "currency": r.currency,
                "category_id": r.category_id,
            }
            for r in recommendations
        ],
        "sms_preview": sms_text,
        "char_count": len(sms_text),
    }


@router.post("/sms/recommendations/run-batch")
async def trigger_sms_recommendations_batch(
    batch_limit: int = Query(default=150, ge=1, le=500),
    require_opt_in: bool = Query(default=False),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Admin-triggered immediate dispatch of marketing SMS recommendations.
    Enforces per-user 48h cooldown and weekly cap.
    """
    logger.info(
        f"Admin {current_user.id} manually triggered recommendation SMS batch "
        f"(batch_limit={batch_limit}, require_opt_in={require_opt_in})"
    )
    result = marketing_sms_service.process_recommendation_batch(
        session,
        batch_limit=batch_limit,
        require_opt_in=require_opt_in,
    )
    return {
        "status": "success",
        "result": result,
    }


@router.post("/sms/opt-out")
async def opt_out_sms(
    payload: Dict[str, Any],
    session: Session = Depends(get_db),
):
    """
    Opt out a phone number from receiving marketing SMS messages.
    Can be called by web users or SMS webhooks (e.g. 'STOP').
    """
    phone = payload.get("phone")
    if not phone or len(str(phone).strip()) < 7:
        raise HTTPException(status_code=400, detail="A valid phone number is required")

    result = marketing_sms_service.opt_out_phone(session, str(phone))
    return {
        "status": "success",
        "message": "Phone number successfully opted out from marketing SMS",
        "details": result,
    }


@router.get("/sms/recommendations/stats")
async def get_sms_recommendations_stats(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Get metrics on users with phone numbers, opt-outs, and recommendation SMS sent.
    """
    total_users = session.exec(select(func.count(User.id))).one()
    users_with_phone = session.exec(
        select(func.count(User.id)).where(User.phone.isnot(None), User.phone != "")
    ).one()
    active_with_phone = session.exec(
        select(func.count(User.id)).where(
            User.is_active == True,
            User.phone.isnot(None),
            User.phone != "",
        )
    ).one()
    opted_out_count = session.exec(
        select(func.count(func.distinct(CampaignSendLog.user_id))).where(
            CampaignSendLog.campaign_type == "sms_opt_out"
        )
    ).one()
    total_recommendations_sent = session.exec(
        select(func.count(CampaignSendLog.id)).where(
            CampaignSendLog.campaign_type == "sms_recommendation"
        )
    ).one()

    return {
        "total_users": total_users,
        "users_with_phone": users_with_phone,
        "active_with_phone": active_with_phone,
        "opted_out_users": opted_out_count,
        "total_recommendations_sent": total_recommendations_sent,
        "schedule": "Tuesday, Thursday, Saturday at 08:00 UTC (11:00 AM EAT)",
        "cooldown_hours": 48,
        "max_per_week": 3,
    }

