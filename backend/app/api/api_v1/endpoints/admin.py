from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from pydantic import BaseModel
from app.api import deps
from app.models.listing import Listing, Category, ListingRead
from app.models.user import User
from app.models.promotion import Promotion, PromotionStatus
from app.models.audit import AuditLog

router = APIRouter()


@router.get("/stats", response_model=dict)
def read_admin_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Get platform statistics.
    """
    total_users = db.exec(select(func.count(User.id))).one()
    total_listings = db.exec(select(func.count(Listing.id))).one()
    active_listings = db.exec(select(func.count(Listing.id)).where(Listing.status == "active")).one()
    pending_listings = db.exec(select(func.count(Listing.id)).where(Listing.status == "pending")).one()
    pending_promotions = db.exec(select(func.count(Promotion.id)).where(Promotion.status == PromotionStatus.SUBMITTED)).one()
    
    return {
        "total_users": total_users,
        "total_listings": total_listings,
        "active_listings": active_listings,
        "pending_listings": pending_listings,
        "pending_promotions": pending_promotions,
    }


@router.get("/queue", response_model=List[ListingRead])
def read_moderation_queue(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get listings awaiting moderation.
    """
    statement = select(Listing).where(Listing.status == "pending").offset(skip).limit(limit)
    listings = db.exec(statement).all()
    return listings


@router.post("/moderate/{listing_id}", response_model=Listing)
def moderate_listing(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    listing_id: int,
    approve: bool = True,
) -> Any:
    """
    Approve or reject a listing.
    """
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing.status = "active" if approve else "rejected"
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.get("/users", response_model=List[User])
def read_users_admin(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List all users (Admin only).
    """
    statement = select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
    users = db.exec(statement).all()
    return users

class AgentEmailIn(BaseModel):
    email: str

@router.get("/agents", response_model=List[dict])
def list_agents(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    agents = db.exec(select(User).where(User.is_agent == True).order_by(User.created_at.desc())).all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "phone": u.phone, "created_at": u.created_at.isoformat()} for u in agents]

@router.post("/agents/add")
def add_agent(
    payload: AgentEmailIn,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    user = db.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email.")
    if user.is_agent:
        raise HTTPException(status_code=400, detail="This user is already an agent.")
    user.is_agent = True
    db.add(user)
    db.commit()
    return {"success": True, "name": user.full_name, "email": user.email}

@router.post("/agents/remove")
def remove_agent(
    payload: AgentEmailIn,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    user = db.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email.")
    user.is_agent = False
    db.add(user)
    db.commit()
    return {"success": True}

@router.post("/users/{user_id}/status")
def update_user_status(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    user_id: int,
    is_active: bool,
) -> Any:
    """
    Deactivate or activate a user account.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = is_active
    db.add(user)
    
    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="USER_STATUS_UPDATE",
        resource_type="user",
        resource_id=user_id,
        details=f"User {'activated' if is_active else 'deactivated'}"
    ))
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user_admin(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    user_id: int,
) -> Any:
    """
    Permanently delete a user account.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    
    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="USER_DELETE",
        resource_type="user",
        resource_id=user_id,
        details="User permanently deleted"
    ))
    
    db.commit()
    return {"success": True}


@router.get("/email/analytics", response_model=dict)
def read_email_analytics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Get highly performant, enterprise-grade Email Growth Engine analytics.
    Reports campaign CTRs, regional engagement, and onboarding funnel conversion rates.
    """
    from app.models.email_log import EmailLog
    import json

    # 1. Aggregate Campaign CTRs using DB Grouping
    group_stats = db.exec(
        select(EmailLog.email_type, EmailLog.status, func.count(EmailLog.id))
        .group_by(EmailLog.email_type, EmailLog.status)
    ).all()

    campaigns = {}
    for email_type, status, count in group_stats:
        if email_type not in campaigns:
            campaigns[email_type] = {"sent": 0, "opened": 0, "clicked": 0, "failed": 0, "total": 0}
        campaigns[email_type]["total"] += count
        if status in ["sent", "opened", "clicked"]:
            campaigns[email_type]["sent"] += count
        if status == "opened":
            campaigns[email_type]["opened"] += count
        elif status == "clicked":
            # Clicked implies opened as well for analytic tracking
            campaigns[email_type]["opened"] += count
            campaigns[email_type]["clicked"] += count
        elif status == "failed":
            campaigns[email_type]["failed"] += count

    # Compute high-fidelity percentages
    for c_type, stats in campaigns.items():
        sent_count = stats["sent"]
        stats["open_rate"] = f"{(stats['opened'] / sent_count * 100):.1f}%" if sent_count > 0 else "0.0%"
        stats["click_rate"] = f"{(stats['clicked'] / sent_count * 100):.1f}%" if sent_count > 0 else "0.0%"
        stats["ctr"] = f"{(stats['clicked'] / stats['opened'] * 100):.1f}%" if stats["opened"] > 0 else "0.0%"

    # 2. Compute Onboarding Funnel Conversion Rates
    welcome_sent = campaigns.get("onboarding_welcome", {}).get("sent", 0)
    welcome_opened = campaigns.get("onboarding_welcome", {}).get("opened", 0)
    profile_sent = campaigns.get("onboarding_complete_profile", {}).get("sent", 0)
    first_action_sent = campaigns.get("onboarding_first_action", {}).get("sent", 0)

    onboarding_funnel = {
        "welcome_sent": welcome_sent,
        "welcome_opened": welcome_opened,
        "profile_sent": profile_sent,
        "first_action_sent": first_action_sent,
        "welcome_to_open_ratio": f"{(welcome_opened / welcome_sent * 100):.1f}%" if welcome_sent > 0 else "0.0%",
        "profile_completion_ratio": f"{(profile_sent / welcome_opened * 100):.1f}%" if welcome_opened > 0 else "0.0%",
        "activation_conversion_ratio": f"{(first_action_sent / welcome_opened * 100):.1f}%" if welcome_opened > 0 else "0.0%"
    }

    # 3. Analyze Regional Engagement from Hit Metadata
    metadata_logs = db.exec(
        select(EmailLog.metadata_json)
        .where(EmailLog.metadata_json != None)
        .limit(1000)
    ).all()

    regional_hits = {}
    total_tracked_hits = 0
    for meta_str in metadata_logs:
        if not meta_str:
            continue
        try:
            meta = json.loads(meta_str)
            for hit in meta.get("hits", []):
                total_tracked_hits += 1
                ip = hit.get("ip", "unknown")
                # Group by IP segment to simulate geographical region clusters
                ip_segment = ".".join(ip.split(".")[:2]) if "." in ip else "unknown"
                if ip_segment not in regional_hits:
                    regional_hits[ip_segment] = 0
                regional_hits[ip_segment] += 1
        except Exception:
            continue

    # Return top engagement regions
    sorted_regions = sorted(regional_hits.items(), key=lambda x: x[1], reverse=True)[:5]
    regions_breakdown = [{"region_cluster": r, "hits": h} for r, h in sorted_regions]

    return {
        "campaigns": campaigns,
        "onboarding_funnel": onboarding_funnel,
        "regional_engagement": {
            "total_tracked_hits": total_tracked_hits,
            "top_regions": regions_breakdown
        }
    }


class ManualEmailSend(BaseModel):
    email: str
    subject: str
    title: str
    subtitle: Optional[str] = None
    content_html: str
    action_text: Optional[str] = None
    action_url: Optional[str] = None
    campaign_id: Optional[str] = None


class BroadcastEmailSend(BaseModel):
    subject: str
    title: str
    subtitle: Optional[str] = None
    content_html: str
    action_text: Optional[str] = None
    action_url: Optional[str] = None
    campaign_id: Optional[str] = None


@router.post("/email/send-manual")
def send_manual_email(
    *,
    payload: ManualEmailSend,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Send a manual tracked custom email to a specific customer profile.
    Saves in EmailLog and routes asynchronously via Celery worker queue.
    """
    from app.tasks.celery_app import celery_app
    
    target_user = db.exec(select(User).where(User.email == payload.email)).first()
    target_user_id = target_user.id if target_user else None

    celery_app.send_task(
        "app.tasks.email_tasks.dispatch_growth_email",
        args=["crm_manual", payload.email, {
            "subject": payload.subject,
            "title": payload.title,
            "subtitle": payload.subtitle,
            "content_html": payload.content_html,
            "action_text": payload.action_text,
            "action_url": payload.action_url
        }],
        kwargs={
            "user_id": target_user_id,
            "campaign_id": payload.campaign_id or "manual_direct"
        }
    )
    return {"success": True, "message": f"Manual email successfully queued for {payload.email}"}


@router.post("/email/broadcast")
def send_broadcast_email(
    *,
    payload: BroadcastEmailSend,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Broadcast a manual tracked custom email to ALL active customer profiles at once.
    Saves in EmailLog and routes asynchronously via Celery worker queue.
    """
    from app.tasks.celery_app import celery_app
    active_users = db.exec(select(User).where(User.is_active == True)).all()
    
    import datetime
    current_date_str = datetime.date.today().strftime("%B %d, %Y")
    
    count = 0
    for u in active_users:
        if not u.email:
            continue
        
        # Resolve user metadata
        name_placeholder = u.full_name or "customer"
        email_placeholder = u.email
        phone_placeholder = u.phone_number or "None"
        location_placeholder = "N/A"
        
        # Apply replacements to all fields
        def apply_replacements(text: Optional[str]) -> Optional[str]:
            if not text:
                return text
            text = text.replace("{{name}}", name_placeholder)
            text = text.replace("{{email}}", email_placeholder)
            text = text.replace("{{phone}}", phone_placeholder)
            text = text.replace("{{location}}", location_placeholder)
            text = text.replace("{{date}}", current_date_str)
            return text
            
        subj = apply_replacements(payload.subject)
        tit = apply_replacements(payload.title)
        subt = apply_replacements(payload.subtitle)
        body = apply_replacements(payload.content_html)
        action_text = apply_replacements(payload.action_text)
        action_url = apply_replacements(payload.action_url)
        
        celery_app.send_task(
            "app.tasks.email_tasks.dispatch_growth_email",
            args=["crm_manual", u.email, {
                "subject": subj,
                "title": tit,
                "subtitle": subt,
                "content_html": body,
                "action_text": action_text,
                "action_url": action_url
            }],
            kwargs={
                "user_id": u.id,
                "campaign_id": payload.campaign_id or "broadcast_all"
            }
        )
        count += 1
        
    return {"success": True, "message": f"Broadcast successfully queued for {count} active customers."}

