"""
Sellers API
===========
Sellers are NOT a separate database entity.
Any user who:
  1. has `is_verified = true`
  2. has `is_active = true`
  3. has at least one listing with status='active' AND moderation_status='approved'
…is automatically considered a seller.
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlmodel import Session, select, func
from sqlalchemy import text
from app.api import deps
from app.models.user import User
from pydantic import BaseModel
import uuid
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)
from app.services.storage_service import storage_service

router = APIRouter()


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    business_name: Optional[str] = None
    shop_description: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    market: Optional[str] = None


@router.get("/")
def list_sellers(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(default=None, description="Search by name, business name, or email"),
    featured_only: bool = Query(default=False),
) -> Any:
    """
    List all sellers.
    A seller = a verified, active user with at least one approved active listing.
    No registration required — automatic qualification.
    """
    try:
        search_clause = ""
        featured_clause = ""
        params: dict = {"skip": skip, "limit": limit}

        if search:
            search_clause = """
                AND (
                    u.full_name ILIKE :search
                    OR u.business_name ILIKE :search
                    OR u.email ILIKE :search
                )
            """
            params["search"] = f"%{search}%"

        if featured_only:
            featured_clause = "AND u.is_featured = true"

        query = text(f"""
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.business_name,
                u.shop_description,
                u.shop_page_banner,
                u.avatar_url,
                u.is_verified,
                u.is_featured,
                u.free_delivery,
                u.verified_level,
                u.trust_score,
                u.trust_level,
                u.location,
                u.response_time,
                u.created_at,
                COUNT(DISTINCT l.id) AS listings_count
            FROM "user" u
            INNER JOIN listing l
                ON l.owner_id = u.id
                AND l.status = 'active'
                AND l.moderation_status = 'approved'
            WHERE u.is_verified = true
              AND u.is_active = true
              {search_clause}
              {featured_clause}
            GROUP BY u.id
            ORDER BY u.is_featured DESC, u.trust_score DESC, u.created_at DESC
            LIMIT :limit OFFSET :skip
        """)

        rows = db.execute(query, params).fetchall()

        return [
            {
                "id": row[0],
                "full_name": row[1],
                "email": row[2],
                "phone": row[3],
                "business_name": row[4] or row[1],
                "shop_description": row[5],
                "shop_page_banner": row[6],
                "avatar_url": row[7],
                "is_verified": bool(row[8]),
                "is_featured": bool(row[9]),
                "free_delivery": bool(row[10]),
                "verified_level": row[11],
                "trust_score": row[12] or 0,
                "trust_level": row[13] or "NEW",
                "location": row[14],
                "response_time": row[15] or "Typically responds in a few hours",
                "created_at": str(row[16]),
                "listings_count": int(row[17]),
            }
            for row in rows
        ]
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error listing sellers: {str(e)}")


@router.get("/me")
def get_current_seller(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get the current authenticated user's seller profile.
    """
    from sqlalchemy import func
    from app.models.listing import Listing

    listings_count = db.query(func.count(Listing.id)).filter(
        Listing.owner_id == current_user.id,
        Listing.status == "active",
        Listing.moderation_status == "approved"
    ).scalar() or 0

    from app.services.seller_performance_service import calculate_seller_performance
    perf = calculate_seller_performance(current_user.id, db)

    return {
        "id": current_user.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": getattr(current_user, "phone", None),
        "business_name": getattr(current_user, "business_name", None) or current_user.full_name,
        "shop_description": getattr(current_user, "shop_description", None),
        "shop_page_banner": getattr(current_user, "shop_page_banner", None),
        "shop_detail_banner": getattr(current_user, "shop_detail_banner", None),
        "avatar_url": getattr(current_user, "avatar_url", None),
        "logo_url": getattr(current_user, "logo_url", None),
        "is_verified": getattr(current_user, "is_verified", False),
        "is_featured": getattr(current_user, "is_featured", False),
        "free_delivery": getattr(current_user, "free_delivery", False),
        "verified_level": getattr(current_user, "verified_level", None),
        "trust_score": getattr(current_user, "trust_score", 0) or 0,
        "trust_level": getattr(current_user, "trust_level", "NEW") or "NEW",
        "location": getattr(current_user, "location", None),
        "response_time": perf["response_time"],
        "response_rate": perf["response_rate"],
        "median_response_time_minutes": perf["median_response_time_minutes"],
        "average_rating": perf["average_rating"],
        "reviews_count": perf["reviews_count"],
        "badges": perf["badges"],
        "created_at": str(getattr(current_user, "created_at", "")),
        "listings_count": listings_count,
    }


@router.get("/me/dashboard")
def get_seller_dashboard_overview(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Simplified, non-technical seller dashboard overview backed by real metrics.
    """
    from app.models.listing import Listing
    from app.models.message import Message

    # 1. Product counts by simple status
    active_count = db.exec(
        select(func.count(Listing.id))
        .where(Listing.owner_id == current_user.id)
        .where(Listing.status == "active")
        .where(Listing.moderation_status == "approved")
        .where(Listing.is_sold == False)
    ).one() or 0

    under_review_count = db.exec(
        select(func.count(Listing.id))
        .where(Listing.owner_id == current_user.id)
        .where(Listing.moderation_status == "pending")
    ).one() or 0

    needs_changes_count = db.exec(
        select(func.count(Listing.id))
        .where(Listing.owner_id == current_user.id)
        .where(Listing.moderation_status == "rejected")
    ).one() or 0

    sold_count = db.exec(
        select(func.count(Listing.id))
        .where(Listing.owner_id == current_user.id)
        .where(Listing.is_sold == True)
    ).one() or 0

    # 2. Total views across seller's listings
    total_views = db.exec(
        select(func.sum(Listing.views))
        .where(Listing.owner_id == current_user.id)
    ).one() or 0

    # 3. Unread messages for seller
    unread_messages = db.exec(
        select(func.count(Message.id))
        .where(Message.receiver_id == current_user.id)
        .where(Message.is_read == False)
    ).one() or 0

    # 4. Recent buyer inquiries (last 5)
    recent_messages = db.exec(
        select(Message)
        .where(Message.receiver_id == current_user.id)
        .order_by(Message.created_at.desc())
        .limit(5)
    ).all()

    inquiries = []
    for msg in recent_messages:
        sender = db.get(User, msg.sender_id)
        inquiries.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": sender.full_name if sender else "Buyer",
            "content": msg.content[:80] if msg.content else "Inquiry about your product",
            "listing_id": msg.listing_id,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        })

    # 5. Products needing attention (rejected / needs changes, or pending)
    needing_attention = db.exec(
        select(Listing)
        .where(Listing.owner_id == current_user.id)
        .where(Listing.moderation_status.in_(["rejected", "pending"]))
        .order_by(Listing.updated_at.desc())
        .limit(4)
    ).all()

    attention_items = []
    for l in needing_attention:
        status_label = "Under review" if l.moderation_status == "pending" else "Needs changes"
        attention_items.append({
            "id": l.id,
            "title": l.title_en or l.title_so,
            "price": l.price,
            "currency": l.currency or "KES",
            "status_label": status_label,
            "rejection_reason": l.rejection_reason if l.moderation_status == "rejected" else None,
            "image": l.images[0] if l.images else None,
        })

    return {
        "seller_name": current_user.full_name,
        "shop_name": getattr(current_user, "business_name", None) or current_user.full_name,
        "active_products": active_count,
        "under_review_products": under_review_count,
        "needs_changes_products": needs_changes_count,
        "sold_products": sold_count,
        "total_views": total_views,
        "unread_messages": unread_messages,
        "recent_inquiries": inquiries,
        "products_needing_attention": attention_items,
    }


class StaffInviteRequest(BaseModel):
    email: str
    role: str = "sales"


@router.get("/me/staff")
def get_my_staff(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get staff members for the current seller shop."""
    from app.models.subscription_features import StaffAccount

    staff_records = db.exec(
        select(StaffAccount).where(StaffAccount.seller_id == current_user.id)
    ).all()

    result = []
    for staff in staff_records:
        user_record = db.get(User, staff.user_id)
        email = user_record.email if user_record else "staff@suqafuran.com"
        name = (user_record.full_name if user_record and user_record.full_name else email.split("@")[0])
        result.append({
            "id": staff.id,
            "email": email,
            "name": name,
            "role": staff.role,
            "last_active": staff.last_login.isoformat() if staff.last_login else None,
            "invited_at": staff.created_at.isoformat() if staff.created_at else None,
            "status": "active" if staff.is_active else "pending",
        })
    return result


@router.post("/me/staff")
def invite_staff(
    invite_in: StaffInviteRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Invite or add a staff member for the current seller shop and send an invitation email."""
    from app.models.subscription_features import StaffAccount, ShopBranding
    from app.models.seller_profile import SellerProfile
    from app.services.subscription_service import subscription_service
    from app.services.email_service import email_service
    from app.core.security import get_password_hash
    import secrets

    # Check seller plan staff limit unless user is admin
    is_admin = bool(getattr(current_user, "is_admin", False) or getattr(current_user, "role", "") == "admin")
    if not is_admin:
        features = subscription_service.get_seller_features(current_user.id, db)
        has_staff = bool(features and features.has_staff_accounts)
        max_staff = (features.max_staff if features and features.max_staff else 3)
        if not has_staff:
            raise HTTPException(status_code=403, detail="Staff accounts require a Business or Enterprise subscription plan.")

        current_count = len(db.exec(select(StaffAccount).where(StaffAccount.seller_id == current_user.id)).all())
        if current_count >= max_staff:
            raise HTTPException(status_code=400, detail=f"You have reached your plan limit of {max_staff} staff members.")

    email_clean = invite_in.email.strip().lower()
    if not email_clean:
        raise HTTPException(status_code=400, detail="A valid email is required.")

    # Find or create user
    target_user = db.exec(select(User).where(User.email == email_clean)).first()
    if not target_user:
        random_pwd = secrets.token_urlsafe(16)
        target_user = User(
            email=email_clean,
            full_name=email_clean.split("@")[0].replace(".", " ").title(),
            is_active=True,
            is_verified=False,
            hashed_password=get_password_hash(random_pwd),
        )
        db.add(target_user)
        db.commit()
        db.refresh(target_user)

    # Check if already a staff member
    existing_staff = db.exec(
        select(StaffAccount).where(
            StaffAccount.seller_id == current_user.id,
            StaffAccount.user_id == target_user.id,
        )
    ).first()
    if existing_staff:
        raise HTTPException(status_code=400, detail="This user is already a staff member of your shop.")

    invite_token = secrets.token_urlsafe(32)

    new_staff = StaffAccount(
        seller_id=current_user.id,
        user_id=target_user.id,
        role=invite_in.role,
        permissions={
            "manage_products": invite_in.role == "manager",
            "manage_orders": invite_in.role == "manager",
            "reply_messages": invite_in.role in ("manager", "sales"),
            "update_inventory": invite_in.role in ("manager", "inventory"),
            "invite_token": invite_token,
            "invite_status": "pending",
        },
        is_active=False,
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    # Resolve shop name
    shop_name = current_user.full_name or "Suqafuran Shop"
    profile = db.exec(select(SellerProfile).where(SellerProfile.seller_id == current_user.id)).first()
    if profile and profile.shop_name:
        shop_name = profile.shop_name
    else:
        branding = db.exec(select(ShopBranding).where(ShopBranding.seller_id == current_user.id)).first()
        if branding and branding.business_name:
            shop_name = branding.business_name

    inviter_name = current_user.full_name or current_user.email.split("@")[0]
    accept_url = f"{settings.FRONTEND_URL}/api/v1/sellers/staff/accept?token={invite_token}"

    email_sent = False
    try:
        email_sent = email_service.send_staff_invitation_email(
            email=target_user.email,
            shop_name=shop_name,
            role=new_staff.role,
            inviter_name=inviter_name,
            accept_url=accept_url,
            user_id=target_user.id,
        )
    except Exception as e:
        logger.error(f"Failed to send staff invitation email to {target_user.email}: {e}")

    return {
        "id": new_staff.id,
        "email": target_user.email,
        "name": target_user.full_name or target_user.email.split("@")[0],
        "role": new_staff.role,
        "last_active": None,
        "invited_at": new_staff.created_at.isoformat() if new_staff.created_at else None,
        "status": "pending",
        "email_sent": email_sent,
    }


@router.get("/staff/accept")
def accept_staff_invitation(
    token: str = Query(...),
    db: Session = Depends(deps.get_db),
) -> Any:
    """Accept a staff invitation via token sent in email."""
    from fastapi.responses import HTMLResponse
    from app.models.subscription_features import StaffAccount, ShopBranding
    from app.models.seller_profile import SellerProfile

    if not token or not token.strip():
        raise HTTPException(status_code=400, detail="Invalid invitation token.")

    all_staff = db.exec(select(StaffAccount)).all()
    matching_staff = [s for s in all_staff if (s.permissions or {}).get("invite_token") == token.strip()]

    if not matching_staff:
        return HTMLResponse(
            content=f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Invitation Expired - Suqafuran</title>
              <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }}
                .card {{ background: white; border-radius: 24px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
                h1 {{ color: #0f172a; font-size: 22px; margin: 0 0 10px 0; font-weight: 800; }}
                p {{ color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }}
                .btn {{ display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 800; font-size: 14px; }}
              </style>
            </head>
            <body>
              <div class="card">
                <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                <h1>Invitation Expired or Already Used</h1>
                <p>This staff invitation link is invalid or has already been accepted. Please ask your shop administrator to send a new invite if needed.</p>
                <a href="{settings.FRONTEND_URL}/login" class="btn">Log In to Suqafuran</a>
              </div>
            </body>
            </html>
            """,
            status_code=400,
        )

    staff = matching_staff[0]
    staff.is_active = True
    new_perms = dict(staff.permissions or {})
    new_perms["invite_status"] = "accepted"
    new_perms.pop("invite_token", None)
    staff.permissions = new_perms
    db.add(staff)
    db.commit()
    db.refresh(staff)

    # Get shop name
    seller_user = db.get(User, staff.seller_id)
    shop_name = seller_user.full_name or "Suqafuran Shop" if seller_user else "the Shop"
    profile = db.exec(select(SellerProfile).where(SellerProfile.seller_id == staff.seller_id)).first()
    if profile and profile.shop_name:
        shop_name = profile.shop_name

    role_labels = {
        "manager": "Shop Manager",
        "sales": "Salesperson",
        "inventory": "Inventory Specialist",
        "support": "Customer Support",
    }
    role_label = role_labels.get(staff.role.lower(), staff.role.title())
    redirect_url = f"{settings.FRONTEND_URL}/seller-dashboard?staff_accepted=1"

    return HTMLResponse(
        content=f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="refresh" content="4;url={redirect_url}">
          <title>Invitation Accepted - Suqafuran</title>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }}
            .card {{ background: white; border-radius: 28px; padding: 48px 36px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
            .badge {{ display: inline-block; background: #e0f2fe; color: #0284c7; font-weight: 800; font-size: 11px; padding: 6px 14px; border-radius: 100px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }}
            h1 {{ color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 12px 0; }}
            p {{ color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0; }}
            .btn {{ display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 14px 32px; border-radius: 14px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35); }}
            .countdown {{ font-size: 12px; color: #94a3b8; margin-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Team Invitation</span>
            <div style="font-size: 52px; margin-bottom: 12px;">🎉</div>
            <h1>Welcome to {shop_name}!</h1>
            <p>You have successfully accepted the invitation to join <strong>{shop_name}</strong> as a <strong>{role_label}</strong>. You now have full access to your assigned seller tools.</p>
            <a href="{redirect_url}" class="btn">Go to Seller Dashboard &rarr;</a>
            <div class="countdown">Redirecting you to the dashboard in 4 seconds...</div>
          </div>
        </body>
        </html>
        """,
        status_code=200,
    )


@router.post("/staff/accept")
def accept_staff_invitation_api(
    data: dict,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Accept a staff invitation via JSON API."""
    from app.models.subscription_features import StaffAccount

    token = data.get("token")
    if not token or not str(token).strip():
        raise HTTPException(status_code=400, detail="Invitation token is required.")

    all_staff = db.exec(select(StaffAccount)).all()
    matching_staff = [s for s in all_staff if (s.permissions or {}).get("invite_token") == str(token).strip()]

    if not matching_staff:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation token.")

    staff = matching_staff[0]
    staff.is_active = True
    new_perms = dict(staff.permissions or {})
    new_perms["invite_status"] = "accepted"
    new_perms.pop("invite_token", None)
    staff.permissions = new_perms
    db.add(staff)
    db.commit()

    return {"status": "success", "message": "Invitation accepted successfully."}


@router.post("/me/staff/{staff_id}/resend")
def resend_staff_invitation(
    staff_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Resend invitation email to a pending staff member."""
    from app.models.subscription_features import StaffAccount, ShopBranding
    from app.models.seller_profile import SellerProfile
    from app.services.email_service import email_service
    import secrets

    staff = db.get(StaffAccount, staff_id)
    if not staff or staff.seller_id != current_user.id:
        raise HTTPException(status_code=404, detail="Staff account not found.")

    target_user = db.get(User, staff.user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User account not found.")

    # Generate or reuse token
    perms = dict(staff.permissions or {})
    invite_token = perms.get("invite_token") or secrets.token_urlsafe(32)
    perms["invite_token"] = invite_token
    perms["invite_status"] = "pending"
    staff.permissions = perms
    db.add(staff)
    db.commit()

    shop_name = current_user.full_name or "Suqafuran Shop"
    profile = db.exec(select(SellerProfile).where(SellerProfile.seller_id == current_user.id)).first()
    if profile and profile.shop_name:
        shop_name = profile.shop_name
    else:
        branding = db.exec(select(ShopBranding).where(ShopBranding.seller_id == current_user.id)).first()
        if branding and branding.business_name:
            shop_name = branding.business_name

    inviter_name = current_user.full_name or current_user.email.split("@")[0]
    accept_url = f"{settings.FRONTEND_URL}/api/v1/sellers/staff/accept?token={invite_token}"

    email_service.send_staff_invitation_email(
        email=target_user.email,
        shop_name=shop_name,
        role=staff.role,
        inviter_name=inviter_name,
        accept_url=accept_url,
        user_id=target_user.id,
    )

    return {"status": "success", "message": f"Invitation email resent to {target_user.email}."}


@router.delete("/me/staff/{staff_id}")
def remove_staff(
    staff_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Remove a staff member from the current seller shop."""
    from app.models.subscription_features import StaffAccount

    staff = db.get(StaffAccount, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff account not found.")

    is_admin = bool(getattr(current_user, "is_admin", False) or getattr(current_user, "role", "") == "admin")
    if staff.seller_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to remove this staff member.")

    db.delete(staff)
    db.commit()
    return {"status": "success", "message": "Staff member removed successfully."}


@router.get("/count")
def count_sellers(
    db: Session = Depends(deps.get_db),
    search: Optional[str] = Query(default=None),
) -> Any:
    """Count of all qualified sellers (for pagination)."""
    try:
        search_clause = ""
        params: dict = {}

        if search:
            search_clause = """
                AND (
                    u.full_name ILIKE :search
                    OR u.business_name ILIKE :search
                    OR u.email ILIKE :search
                )
            """
            params["search"] = f"%{search}%"

        query = text(f"""
            SELECT COUNT(DISTINCT u.id)
            FROM "user" u
            INNER JOIN listing l
                ON l.owner_id = u.id
                AND l.status = 'active'
                AND l.moderation_status = 'approved'
            WHERE u.is_verified = true
              AND u.is_active = true
              {search_clause}
        """)

        total = db.execute(query, params).scalar() or 0
        return {"total": int(total)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{seller_id}")
def get_seller(
    seller_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get a single seller's public profile by user ID.
    Returns 404 if the user is not a qualified seller
    (not verified, or no active approved listings).
    """
    try:
        query = text("""
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.business_name,
                u.shop_description,
                u.shop_page_banner,
                u.shop_detail_banner,
                u.avatar_url,
                u.logo_url,
                u.is_verified,
                u.is_featured,
                u.free_delivery,
                u.verified_level,
                u.trust_score,
                u.trust_level,
                u.location,
                u.response_time,
                u.created_at,
                COALESCE(COUNT(DISTINCT l.id), 0) AS listings_count
            FROM "user" u
            LEFT JOIN listing l
                ON l.owner_id = u.id
                AND l.status = 'active'
                AND l.moderation_status = 'approved'
            WHERE u.id = :seller_id
              AND u.is_active = true
            GROUP BY u.id
        """)

        row = db.execute(query, {"seller_id": seller_id}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Seller not found")

        from app.services.seller_performance_service import calculate_seller_performance
        perf = calculate_seller_performance(seller_id, db)

        return {
            "id": row[0],
            "full_name": row[1],
            "email": row[2],
            "phone": row[3],
            "business_name": row[4] or row[1],
            "shop_description": row[5],
            "shop_page_banner": row[6],
            "shop_detail_banner": row[7],
            "avatar_url": row[8],
            "logo_url": row[9],
            "is_verified": bool(row[10]),
            "is_featured": bool(row[11]),
            "free_delivery": bool(row[12]),
            "verified_level": row[13],
            "trust_score": row[14] or 0,
            "trust_level": row[15] or "NEW",
            "location": row[16],
            "response_time": perf["response_time"],
            "response_rate": perf["response_rate"],
            "median_response_time_minutes": perf["median_response_time_minutes"],
            "average_rating": perf["average_rating"],
            "reviews_count": perf["reviews_count"],
            "badges": perf["badges"],
            "created_at": str(row[18]),
            "listings_count": int(row[19]),
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{seller_id}/is-seller")
def check_is_seller(
    seller_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Quick check: returns whether a given user qualifies as a seller.
    Used by the frontend to conditionally show seller UI.
    """
    try:
        query = text("""
            SELECT 1
            FROM "user" u
            INNER JOIN listing l
                ON l.owner_id = u.id
                AND l.status = 'active'
                AND l.moderation_status = 'approved'
            WHERE u.id = :seller_id
              AND u.is_verified = true
              AND u.is_active = true
            LIMIT 1
        """)
        result = db.execute(query, {"seller_id": seller_id}).fetchone()
        return {"is_seller": result is not None, "user_id": seller_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/me")
def update_current_seller_profile(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    profile_update: ProfileUpdate,
) -> Any:
    """
    Update the current seller's profile information.
    Allows updating name, business name, shop description, location, etc.
    """
    # Track if this is a new shop creation
    is_new_shop = not current_user.business_name and profile_update.business_name

    # Check phone uniqueness if changing
    if profile_update.phone is not None and profile_update.phone != current_user.phone:
        existing_phone = crud_user.get_user_by_phone(db, phone=profile_update.phone, exclude_user_id=current_user.id)
        if existing_phone:
            raise HTTPException(status_code=400, detail="This phone number is already registered to another account.")
        cleaned_phone = crud_user.normalize_phone(profile_update.phone)
        current_user.phone = cleaned_phone or profile_update.phone

    # Check business name uniqueness if changing
    if profile_update.business_name is not None and profile_update.business_name != current_user.business_name:
        existing_biz = crud_user.get_user_by_business_name(db, business_name=profile_update.business_name, exclude_user_id=current_user.id)
        if existing_biz:
            raise HTTPException(status_code=400, detail="A shop or business with this name already exists. Please choose a unique name.")
        current_user.business_name = profile_update.business_name

    # Update allowed fields
    if profile_update.full_name is not None:
        current_user.full_name = profile_update.full_name
    if profile_update.shop_description is not None:
        current_user.shop_description = profile_update.shop_description
    if profile_update.location is not None:
        current_user.location = profile_update.location
    if profile_update.market is not None:
        current_user.market = profile_update.market

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    # Send shop creation email if this is a new shop
    if is_new_shop:
        try:
            from app.services.marketing_service import marketing_service
            from app.models.marketing import EmailEventType
            import asyncio

            asyncio.run(marketing_service.send_event_email(
                session=db,
                user_id=current_user.id,
                event_type=EmailEventType.SHOP_CREATED,
                context={
                    "first_name": current_user.full_name.split()[0] if current_user.full_name else "Seller",
                    "shop_name": profile_update.business_name or "Your Shop",
                    "shop_link": f"{profile_update.location}/shops/{current_user.id}" if hasattr(profile_update, '__dict__') else "/shops",
                    "add_products_link": "/dashboard/listings/create",
                    "help_link": "/help/create-shop"
                }
            ))
        except Exception as e:
            logger.warning(f"Failed to send shop creation email: {e}")

    return {
        "status": "updated",
        "id": current_user.id,
        "full_name": current_user.full_name,
        "business_name": current_user.business_name,
        "phone": current_user.phone,
        "location": current_user.location,
        "market": current_user.market,
        "shop_description": current_user.shop_description,
        "message": "Profile updated successfully"
    }


@router.post("/me/logo")
async def upload_seller_logo(
    *,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a shop logo for the current seller.
    Logo will be displayed on the shop card in the /shops page.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    extension = file.filename.split(".")[-1].lower()
    if extension not in ["jpg", "jpeg", "png", "gif", "webp"]:
        raise HTTPException(status_code=400, detail="Only image files are allowed (jpg, png, gif, webp)")

    contents = await file.read(5 * 1024 * 1024 + 1)  # 5MB limit
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    filename = f"logo_{current_user.id}_{uuid.uuid4()}.{extension}"

    try:
        url, _ = await storage_service.upload_file(contents, filename)
        current_user.logo_url = url
        db.add(current_user)
        db.commit()
        db.refresh(current_user)

        return {
            "status": "success",
            "logo_url": url,
            "message": "Logo uploaded successfully"
        }
    except Exception as e:
        import logging
        logging.getLogger("sellers_api").error(f"Failed to upload logo: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")
