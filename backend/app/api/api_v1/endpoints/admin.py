from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from pydantic import BaseModel
from app.api import deps
from app.models.listing import Listing, Category, ListingRead
from app.models.user import User
from app.models.promotion import Promotion, PromotionStatus
from app.models.audit import AuditLog
from app.models.business import Business

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
    search: Optional[str] = Query(default=None, description="Search by name, email, or phone"),
) -> Any:
    """
    List all users (Admin only) with optional search.
    """
    statement = select(User)
    if search:
        pattern = f"%{search}%"
        from sqlmodel import or_
        statement = statement.where(
            or_(
                User.full_name.ilike(pattern),
                User.email.ilike(pattern),
                User.phone.ilike(pattern),
            )
        )
    statement = statement.order_by(User.created_at.desc()).offset(skip).limit(limit)
    users = db.exec(statement).all()
    return users


@router.get("/users/count")
def count_users_admin(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    search: Optional[str] = Query(default=None),
) -> Any:
    """
    Count total users (for pagination).
    """
    statement = select(func.count(User.id))
    if search:
        pattern = f"%{search}%"
        from sqlmodel import or_
        statement = statement.where(
            or_(
                User.full_name.ilike(pattern),
                User.email.ilike(pattern),
                User.phone.ilike(pattern),
            )
        )
    total = db.exec(statement).one()
    return {"total": total}

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
    Permanently delete a user account and all related data (cascade).
    """
    from sqlalchemy import text

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    # ── Cascade: delete all FK-linked records in dependency order ─────────────
    # 1. Audit logs referencing this user
    db.exec(text("DELETE FROM auditlog WHERE user_id = :uid").bindparams(uid=user_id))

    # 2. Notifications
    try:
        db.exec(text("DELETE FROM notification WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 3. Device tokens
    try:
        db.exec(text("DELETE FROM devicetoken WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 4. Email logs
    try:
        db.exec(text("DELETE FROM emaillog WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 5. Favorites (as owner or favoriting)
    try:
        db.exec(text("DELETE FROM favorite WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 6. Follows
    try:
        db.exec(text("DELETE FROM follow WHERE follower_id = :uid OR following_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 7. Messages
    try:
        db.exec(text("DELETE FROM message WHERE sender_id = :uid OR recipient_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 8. Mobile money transactions
    try:
        db.exec(text("DELETE FROM mobilemoneytransaction WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 9. Wallet
    try:
        db.exec(text("DELETE FROM wallet WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 10. Trust / fraud records
    try:
        db.exec(text("DELETE FROM trustrecord WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass
    try:
        db.exec(text("DELETE FROM fraudreport WHERE reporter_id = :uid OR reported_user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 11. Meeting deals
    try:
        db.exec(text("DELETE FROM meetingdeal WHERE buyer_id = :uid OR seller_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 12. Verification requests
    try:
        db.exec(text("DELETE FROM verificationrequest WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 13. Support tickets
    try:
        db.exec(text("DELETE FROM supportticket WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 14. Promotions linked to user's listings
    try:
        db.exec(text(
            "DELETE FROM promotion WHERE listing_id IN "
            "(SELECT id FROM listing WHERE owner_id = :uid)"
        ).bindparams(uid=user_id))
    except Exception:
        pass

    # 15. Listing interactions / views
    try:
        db.exec(text(
            "DELETE FROM listinginteraction WHERE listing_id IN "
            "(SELECT id FROM listing WHERE owner_id = :uid)"
        ).bindparams(uid=user_id))
    except Exception:
        pass

    # 16. Listings themselves
    try:
        db.exec(text("DELETE FROM listing WHERE owner_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 17. Business profiles
    try:
        db.exec(text("DELETE FROM business WHERE owner_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 18. Finally delete the user
    db.delete(user)

    # Audit the deletion (attributed to the admin performing it)
    db.add(AuditLog(
        user_id=current_user.id,
        action="USER_DELETE",
        resource_type="user",
        resource_id=user_id,
        details=f"User #{user_id} ({user.email}) permanently deleted by admin"
    ))

    db.commit()
    return {"success": True, "deleted_user_id": user_id}


# ── OTP Lookup (Agent Tool) ───────────────────────────────────────────────────

def _redis_otp_lookup(redis_client, identifier: str) -> dict:
    """
    Shared helper: read an OTP code + TTL from Redis by identifier.
    Both SMS and email OTPs are stored under the same key pattern: otp:{identifier}
    """
    key = f"otp:{identifier}"
    code = redis_client.get(key)
    ttl = redis_client.ttl(key)
    return {"code": code, "ttl": ttl}


@router.get("/otps")
def lookup_otp(
    phone: Optional[str] = Query(default=None, description="Phone number (SMS OTP lookup)"),
    email: Optional[str] = Query(default=None, description="Email address (Resend/email OTP lookup)"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Unified OTP lookup for agents — supports both SMS (phone) and email (Resend) OTPs.
    Both types are stored in Redis as otp:{identifier} with a 5-minute TTL.
    Only available to admins/agents to help customers who didn't receive their code.
    """
    if not phone and not email:
        raise HTTPException(status_code=400, detail="Provide either 'phone' or 'email' query parameter.")

    from app.services.africastalking_service import africastalking_service
    from app.services.email_service import email_service

    # Resolve a Redis client — prefer email_service client (same Redis, just a healthier instance)
    redis_client = africastalking_service.redis or email_service.redis
    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis is not available")

    # ── SMS / Phone OTP ───────────────────────────────────────────────────────
    if phone:
        try:
            normalized = africastalking_service.normalize_phone(phone)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid phone number format. Use +254XXXXXXXXX or 07XXXXXXXX.")

        result = _redis_otp_lookup(redis_client, normalized)
        if not result["code"]:
            return {
                "found": False,
                "channel": "sms",
                "identifier": normalized,
                "message": "No active SMS OTP found for this number. It may have expired or not been requested yet."
            }
        return {
            "found": True,
            "channel": "sms",
            "identifier": normalized,
            "code": result["code"],
            "expires_in_seconds": result["ttl"],
            "message": f"Active SMS OTP found. Expires in {result['ttl']}s."
        }

    # ── Email OTP (Resend / SMTP) ─────────────────────────────────────────────
    if email:
        normalized_email = email.strip().lower()
        result = _redis_otp_lookup(redis_client, normalized_email)
        if not result["code"]:
            return {
                "found": False,
                "channel": "email",
                "identifier": normalized_email,
                "message": "No active email OTP found for this address. It may have expired or not been requested yet."
            }
        return {
            "found": True,
            "channel": "email",
            "identifier": normalized_email,
            "code": result["code"],
            "expires_in_seconds": result["ttl"],
            "message": f"Active email OTP found. Expires in {result['ttl']}s."
        }


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
        phone_placeholder = u.phone or "None"
        location_placeholder = u.location or "None"
        
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


@router.get("/businesses/queue", response_model=List[Business])
def read_businesses_moderation_queue(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get businesses that have opted in for the nearby section.
    """
    statement = select(Business).where(
        Business.show_in_nearby == True
    ).order_by(Business.is_approved.asc(), Business.created_at.desc()).offset(skip).limit(limit)
    return db.exec(statement).all()


@router.post("/businesses/{business_id}/approve", response_model=Business)
def approve_business(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    business_id: str,
) -> Any:
    """
    Approve a business for the nearby section.
    """
    import uuid as uuid_pkg
    try:
        b_id = uuid_pkg.UUID(business_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid business ID format")
        
    business = db.get(Business, b_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    business.is_approved = True
    db.add(business)
    db.commit()
    db.refresh(business)
    return business


@router.post("/businesses/{business_id}/disapprove", response_model=Business)
def disapprove_business(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    business_id: str,
) -> Any:
    """
    Reject/Revoke approval of a business for the nearby section.
    """
    import uuid as uuid_pkg
    try:
        b_id = uuid_pkg.UUID(business_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid business ID format")
        
    business = db.get(Business, b_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    business.is_approved = False
    db.add(business)
    db.commit()
    db.refresh(business)
    return business


