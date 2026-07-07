from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlmodel import Session, select, func
from pydantic import BaseModel
from app.api import deps
from app.models.listing import Listing, Category, ListingRead
from app.models.user import User
from app.models.promotion import Promotion, PromotionStatus
from app.models.audit import AuditLog
from app.models.business import Business
from app.services.storage_service import storage_service

# Try importing Seller from routers (Phase 4)
try:
    from models import Seller
except ImportError:
    Seller = None

router = APIRouter()


# --- Pydantic Models ---
class ShopDetailsUpdate(BaseModel):
    business_name: Optional[str] = None
    full_name: Optional[str] = None

class ShopBannersUpdate(BaseModel):
    shop_page_banner: Optional[str] = None
    shop_detail_banner: Optional[str] = None

class ShopManagementUpdate(BaseModel):
    business_name: Optional[str] = None
    shop_description: Optional[str] = None
    shop_page_banner: Optional[str] = None
    shop_detail_banner: Optional[str] = None
    is_featured: Optional[bool] = None
    is_verified: Optional[bool] = None
    free_delivery: Optional[bool] = None
    is_active: Optional[bool] = None

class UserAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    verified_level: Optional[str] = None
    is_admin: Optional[bool] = None
    is_agent: Optional[bool] = None
    trust_score: Optional[int] = None
    trust_level: Optional[str] = None
    is_flagged: Optional[bool] = None
    is_suspended: Optional[bool] = None
    business_name: Optional[str] = None
    shop_description: Optional[str] = None
    shop_page_banner: Optional[str] = None
    shop_detail_banner: Optional[str] = None
    is_featured: Optional[bool] = None
    free_delivery: Optional[bool] = None

class ShopRead(BaseModel):
    id: int
    business_name: Optional[str] = None
    full_name: Optional[str] = None
    shop_description: Optional[str] = None
    shop_page_banner: Optional[str] = None
    shop_detail_banner: Optional[str] = None
    is_featured: bool = False
    is_verified: bool = False
    free_delivery: bool = False
    is_active: bool = True
    email: str


@router.get("/orders")
def list_all_orders() -> Any:
    """
    List all orders with customer information (Admin endpoint).
    """
    try:
        from database import engine
        from sqlalchemy import text

        with engine.connect() as conn:
            # Use raw SQL to avoid ORM schema mismatch
            result = conn.execute(text("""
                SELECT
                    o.id, o.user_id, o.seller_id, o.status, o.delivery_option,
                    o.delivery_address, o.phone_number, o.total_amount, o.platform_fee,
                    o.seller_amount, o.courier_tip, o.payment_status, o.payment_reference,
                    o.created_at, o.updated_at,
                    u.full_name, u.email
                FROM orders o
                LEFT JOIN "user" u ON o.user_id = CAST(u.id AS VARCHAR)
                ORDER BY o.created_at DESC
                LIMIT 100
            """))

            order_data = []
            for row in result:
                order_info = {
                    "id": str(row[0]),
                    "customer": {
                        "id": str(row[1]),
                        "full_name": str(row[15]) if row[15] else "Unknown",
                        "email": str(row[16]) if row[16] else "",
                    },
                    "status": str(row[3]),
                    "total_amount": float(row[8]) if row[8] else 0,
                    "platform_fee": float(row[9]) if row[9] else 0,
                    "seller_amount": float(row[10]) if row[10] else 0,
                    "payment_status": str(row[11]),
                    "delivery_option": str(row[4]),
                    "created_at": str(row[13]),
                    "updated_at": str(row[14]),
                }
                order_data.append(order_info)

            return order_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


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

    # Push notification to listing owner
    from app.utils.push import send_push_to_user
    if approve:
        send_push_to_user(
            db,
            user_id=listing.owner_id,
            title="Your ad is live!",
            body=f"'{listing.title_en}' has been approved and is now visible to buyers.",
            data={"type": "ad_approved", "listing_id": str(listing.id), "path": f"/listing/{listing.id}"}
        )
    else:
        send_push_to_user(
            db,
            user_id=listing.owner_id,
            title="Ad not approved",
            body=f"'{listing.title_en}' was not approved. Please review and repost.",
            data={"type": "ad_rejected", "listing_id": str(listing.id), "path": "/dashboard"}
        )

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

@router.get("/sellers")
def list_sellers():
    """
    List all verified sellers (Public endpoint - no auth required).
    """
    try:
        from database import SessionLocal
        from models import Seller as SellerModel

        db = SessionLocal()

        # Query sellers with verification_status = 'verified'
        sellers = db.query(SellerModel).filter(
            SellerModel.verification_status == "verified"
        ).order_by(SellerModel.created_at.desc()).all()

        seller_data = []
        for s in sellers:
            # Don't access relationships due to schema mismatch - just use defaults
            order_count = 0
            avg_rating = 0.0

            seller_info = {
                "id": str(s.id),
                "shop_name": str(s.shop_name),
                "owner_name": str(s.owner_name),
                "email": str(s.email),
                "phone": str(s.phone),
                "category": str(s.category),
                "is_active": bool(s.is_active),
                "verification_status": str(s.verification_status),
                "rating": float(round(avg_rating, 1)),
                "listings_count": int(order_count),
                "created_at": str(s.created_at),
            }
            seller_data.append(seller_info)

        db.close()
        return seller_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

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
    # We wrap each execution in a SAVEPOINT using db.begin_nested()
    # so that if a table does not exist or has a different constraint name,
    # the failure won't abort the entire PostgreSQL transaction.
    
    # 1. Audit logs referencing this user
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM auditlog WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 2. Notifications
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM notification WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 3. Device tokens / links
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM userdevicelink WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 4. Email logs
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM emaillog WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 5. Favorites
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM favorite WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 6. Follows
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM follow WHERE follower_id = :uid OR followed_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 7. Messages
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM message WHERE sender_id = :uid OR recipient_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 8. Mobile money transactions / mobile transactions
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM mobiletransaction WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 9. KaalayHeedhePin
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM kaalayheedhepin WHERE owner_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 10. Support tickets
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM supportticket WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 11. Verification requests
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM verificationrequest WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 12. Risk history
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM riskhistory WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 13. Ratings & Reports
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM rating WHERE rater_id = :uid OR rated_user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM report WHERE reporter_id = :uid OR reported_user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 14. Feedback
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM feedback WHERE author_id = :uid OR target_user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 15. Meetings & Deals
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM meeting WHERE buyer_id = :uid OR seller_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM deal WHERE buyer_id = :uid OR seller_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 16. Delivery
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM delivery WHERE seller_id = :uid OR buyer_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 17. Wallet & Transactions & Vouchers
    try:
        with db.begin_nested():
            # Delete transactions belonging to user's wallet
            db.exec(text(
                "DELETE FROM transaction WHERE wallet_id IN "
                "(SELECT id FROM wallet WHERE user_id = :uid)"
            ).bindparams(uid=user_id))
    except Exception:
        pass
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM wallet WHERE user_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass
    try:
        with db.begin_nested():
            db.exec(text("UPDATE voucher SET redeemed_by_id = NULL WHERE redeemed_by_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 18. Promotions linked to user's listings
    try:
        with db.begin_nested():
            db.exec(text(
                "DELETE FROM promotion WHERE listing_id IN "
                "(SELECT id FROM listing WHERE owner_id = :uid)"
            ).bindparams(uid=user_id))
    except Exception:
        pass

    # 19. Listing interactions / views
    try:
        with db.begin_nested():
            db.exec(text(
                "DELETE FROM interaction WHERE listing_id IN "
                "(SELECT id FROM listing WHERE owner_id = :uid)"
            ).bindparams(uid=user_id))
    except Exception:
        pass

    # 20. Business Tasks, Messages, Orders, Customers, Products, Employees under user's business
    try:
        with db.begin_nested():
            # Delete tasks assigned to employees of user's business, or tasks under user's business
            db.exec(text(
                "DELETE FROM businesstask WHERE business_id IN "
                "(SELECT id FROM business WHERE owner_id = :uid) OR "
                "assigned_to IN (SELECT id FROM employee WHERE user_id = :uid)"
            ).bindparams(uid=user_id))
    except Exception:
        pass
    try:
        with db.begin_nested():
            db.exec(text(
                "DELETE FROM teammessage WHERE business_id IN "
                "(SELECT id FROM business WHERE owner_id = :uid) OR "
                "sender_id = :uid"
            ).bindparams(uid=user_id))
    except Exception:
        pass
    try:
        with db.begin_nested():
            db.exec(text(
                "DELETE FROM businessmessage WHERE business_id IN "
                "(SELECT id FROM business WHERE owner_id = :uid) OR "
                "customer_id = :uid OR sender_id = :uid"
            ).bindparams(uid=user_id))
    except Exception:
        pass
    try:
        with db.begin_nested():
            db.exec(text(
                'DELETE FROM "order" WHERE business_id IN '
                '(SELECT id FROM business WHERE owner_id = :uid) OR '
                'customer_id = :uid OR '
                'employee_id IN (SELECT id FROM employee WHERE user_id = :uid)'
            ).bindparams(uid=user_id))
    except Exception:
        pass
    try:
        with db.begin_nested():
            db.exec(text(
                "DELETE FROM businesscustomer WHERE business_id IN "
                "(SELECT id FROM business WHERE owner_id = :uid) OR "
                "user_id = :uid"
            ).bindparams(uid=user_id))
    except Exception:
        pass
    try:
        with db.begin_nested():
            db.exec(text(
                "DELETE FROM businessproduct WHERE business_id IN "
                "(SELECT id FROM business WHERE owner_id = :uid) OR "
                "listing_id IN (SELECT id FROM listing WHERE owner_id = :uid)"
            ).bindparams(uid=user_id))
    except Exception:
        pass
    try:
        with db.begin_nested():
            db.exec(text(
                "DELETE FROM employee WHERE business_id IN "
                "(SELECT id FROM business WHERE owner_id = :uid) OR "
                "user_id = :uid"
            ).bindparams(uid=user_id))
    except Exception:
        pass

    # 21. Listings themselves
    try:
        with db.begin_nested():
            db.exec(text("DELETE FROM listing WHERE owner_id = :uid").bindparams(uid=user_id))
    except Exception:
        pass

    # 22. Business profiles
    try:
        with db.begin_nested():
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


@router.get("/otp-logs")
def get_otp_logs(
    identifier: Optional[str] = Query(None, description="Phone or email to filter by"),
    event_type: Optional[str] = Query(None, description="sent|resent|verified|failed|expired|attempt_failed"),
    channel: Optional[str] = Query(None, description="sms|email"),
    date_from: Optional[str] = Query(None, description="ISO date e.g. 2026-01-01"),
    date_to: Optional[str] = Query(None, description="ISO date e.g. 2026-12-31"),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Query the append-only OTP event log. Supports filtering by identifier,
    event type, channel, and date range.
    """
    from app.models.otp_log import OTPLog
    from sqlmodel import select
    from datetime import datetime

    stmt = select(OTPLog)

    if identifier:
        clean = identifier.strip().lower()
        # Try to match both normalised phone and email
        try:
            from app.services.africastalking_service import africastalking_service
            normalized = africastalking_service.normalize_phone(identifier)
            stmt = stmt.where(
                (OTPLog.identifier == normalized) | (OTPLog.identifier == clean)
            )
        except Exception:
            stmt = stmt.where(OTPLog.identifier == clean)

    if event_type:
        stmt = stmt.where(OTPLog.event_type == event_type)

    if channel:
        stmt = stmt.where(OTPLog.channel == channel)

    if date_from:
        try:
            stmt = stmt.where(OTPLog.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass

    if date_to:
        try:
            stmt = stmt.where(OTPLog.created_at <= datetime.fromisoformat(date_to + "T23:59:59"))
        except ValueError:
            pass

    total_stmt = stmt
    stmt = stmt.order_by(OTPLog.created_at.desc()).offset(offset).limit(limit)
    rows = db.exec(stmt).all()

    return {
        "total": db.exec(select(OTPLog.id).where(*[
            # re-apply same filters for count — simpler to just return len of full query
        ])).all().__len__() if not identifier and not event_type else len(rows),
        "results": [
            {
                "id": r.id,
                "identifier": r.identifier,
                "channel": r.channel,
                "event_type": r.event_type,
                "status": r.status,
                "attempt_count": r.attempt_count,
                "expires_at": r.expires_at.isoformat() if r.expires_at else None,
                "created_at": r.created_at.isoformat(),
                "meta": r.meta,
            }
            for r in rows
        ],
    }


@router.get("/verification-attempts")
def get_verification_attempts(
    identifier: str = Query(..., description="Email or phone of the user to look up"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Return all identity verification requests submitted by a user, looked up by
    their email or phone number.
    """
    from app.models.verification import VerificationRequest
    from app.models.user import User as UserModel
    from sqlmodel import select, or_

    clean = identifier.strip().lower()

    # Resolve user by email or phone
    user = db.exec(
        select(UserModel).where(
            or_(UserModel.email == clean, UserModel.phone == clean)
        )
    ).first()

    # Try normalised phone if not found
    if not user:
        try:
            from app.services.africastalking_service import africastalking_service
            normalized = africastalking_service.normalize_phone(identifier)
            user = db.exec(
                select(UserModel).where(UserModel.phone == normalized)
            ).first()
        except Exception:
            pass

    if not user:
        return {"user": None, "attempts": []}

    attempts = db.exec(
        select(VerificationRequest)
        .where(VerificationRequest.user_id == user.id)
        .order_by(VerificationRequest.created_at.desc())
    ).all()

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "is_verified": user.is_verified,
        },
        "attempts": [
            {
                "id": a.id,
                "document_type": a.document_type,
                "status": a.status,
                "created_at": a.created_at.isoformat(),
                "auto_verification_status": getattr(a, "auto_verification_status", None),
            }
            for a in attempts
        ],
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


# --- Shop Details Management ---
@router.post("/shops/{user_id}/details")
def update_shop_details(
    user_id: int,
    details_data: ShopDetailsUpdate,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Update shop details (business name, owner name) for a specific user/shop."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if details_data.business_name is not None:
            user.business_name = details_data.business_name

        if details_data.full_name is not None:
            user.full_name = details_data.full_name

        db.add(user)
        db.commit()
        db.refresh(user)

        # Sync sellers table with updated shop data
        sync_seller_profile(db, user.id, user.full_name, user.business_name)

        return {
            "id": user.id,
            "full_name": user.full_name,
            "business_name": user.business_name,
            "message": "Shop details updated successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# --- Shop Banner Management ---
@router.post("/shops/{user_id}/banners/upload")
async def upload_shop_banner_file(
    user_id: int,
    banner_type: str,
    file: UploadFile = File(...),
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Upload banner file to Cloudinary and store URL."""
    try:
        if banner_type not in ["shop_page_banner", "shop_detail_banner"]:
            raise HTTPException(status_code=400, detail="Invalid banner_type")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Read file content
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        # Upload to Cloudinary
        url, _ = await storage_service.upload_file(content, file.filename or "banner.jpg")

        # Store URL in database
        if banner_type == "shop_page_banner":
            user.shop_page_banner = url
        else:
            user.shop_detail_banner = url

        db.add(user)
        db.commit()
        db.refresh(user)

        # Sync sellers table with updated banner data
        sync_seller_profile(db, user.id, user.full_name, user.business_name,
                          user.shop_page_banner, user.shop_detail_banner)

        return {
            "id": user.id,
            "banner_type": banner_type,
            "url": url,
            "message": f"{banner_type} uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to upload banner: {str(e)}")


@router.post("/shops/{user_id}/banners")
def upload_shop_banners(
    user_id: int,
    banner_data: ShopBannersUpdate,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Legacy endpoint: Update banner URLs directly (for backwards compatibility)."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if banner_data.shop_page_banner:
            user.shop_page_banner = banner_data.shop_page_banner

        if banner_data.shop_detail_banner:
            user.shop_detail_banner = banner_data.shop_detail_banner

        db.add(user)
        db.commit()
        db.refresh(user)

        # Sync sellers table with updated banner data
        sync_seller_profile(db, user.id, user.full_name, user.business_name,
                          user.shop_page_banner, user.shop_detail_banner)

        return {
            "id": user.id,
            "full_name": user.full_name,
            "shop_page_banner": user.shop_page_banner,
            "shop_detail_banner": user.shop_detail_banner,
            "message": "Shop banners updated successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# SHOP MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/shops", response_model=List[ShopRead])
def get_all_shops(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
    db: Session = Depends(deps.get_db),
) -> Any:
    """Get verified sellers with at least one active listing."""
    try:
        from sqlalchemy import text

        # Fast query with simple INNER JOIN
        query = text("""
            SELECT DISTINCT u.id, u.email, u.full_name, u.business_name, u.created_at
            FROM "user" u
            INNER JOIN listing l ON u.id = l.owner_id
            WHERE u.is_verified = true
              AND u.is_active = true
              AND l.status = 'active'
            ORDER BY u.created_at DESC
            LIMIT :limit OFFSET :skip
        """)

        result = db.execute(query, {"skip": skip, "limit": limit}).fetchall()

        shops = []
        for row in result:
            shops.append(ShopRead(
                id=row[0],
                email=row[1],
                full_name=row[2],
                business_name=row[3] or row[2],
                shop_description="",
                shop_page_banner=None,
                shop_detail_banner=None,
                is_featured=False,
                is_verified=True,
                free_delivery=False,
                is_active=True,
            ))

        return shops
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shops/{shop_id}", response_model=ShopRead)
def get_shop(
    shop_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Get shop details by ID."""
    try:
        # Get user by ID (simple query)
        shop = db.get(User, shop_id)
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")

        return ShopRead(
            id=shop.id,
            business_name=shop.business_name or shop.full_name,
            full_name=shop.full_name,
            shop_description=shop.shop_description or "",
            shop_page_banner=shop.shop_page_banner,
            shop_detail_banner=shop.shop_detail_banner,
            is_featured=shop.is_featured,
            is_verified=shop.is_verified,
            free_delivery=shop.free_delivery,
            is_active=shop.is_active,
            email=shop.email,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def sync_seller_profile(db: Session, user_id: int, full_name: str, business_name: Optional[str],
                       shop_page_banner: Optional[str] = None, shop_detail_banner: Optional[str] = None) -> None:
    """Sync seller profile with user data after updates. Auto-updates sellers table."""
    try:
        from sqlalchemy import text

        # Determine the shop name (business_name takes precedence)
        shop_name = business_name or full_name

        # Build dynamic update query based on what changed
        updates = ["shop_name = :shop_name", "owner_name = :owner_name"]
        params = {
            "shop_name": shop_name,
            "owner_name": full_name,
            "user_id": str(user_id)
        }

        # Include banners if provided
        if shop_page_banner is not None:
            updates.append("shop_page_banner = :shop_page_banner")
            params["shop_page_banner"] = shop_page_banner

        if shop_detail_banner is not None:
            updates.append("shop_detail_banner = :shop_detail_banner")
            params["shop_detail_banner"] = shop_detail_banner

        # Update sellers table for this user
        sync_query = text(f"""
            UPDATE sellers
            SET {', '.join(updates)}
            WHERE user_id = :user_id
        """)

        db.exec(sync_query, params)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request - sync is non-critical
        print(f"⚠️  Warning: Failed to sync sellers table for user {user_id}: {str(e)}")


@router.put("/shops/{shop_id}", response_model=ShopRead)
def update_shop(
    shop_id: int,
    shop_data: ShopManagementUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Update shop details."""
    try:
        # Get user by ID (simple query, no join)
        shop = db.get(User, shop_id)
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")

        # Update fields if provided
        if shop_data.business_name is not None:
            shop.business_name = shop_data.business_name
        if shop_data.shop_description is not None:
            shop.shop_description = shop_data.shop_description
        if shop_data.shop_page_banner is not None:
            shop.shop_page_banner = shop_data.shop_page_banner
        if shop_data.shop_detail_banner is not None:
            shop.shop_detail_banner = shop_data.shop_detail_banner
        if shop_data.is_featured is not None:
            shop.is_featured = shop_data.is_featured
        if shop_data.is_verified is not None:
            shop.is_verified = shop_data.is_verified
        if shop_data.free_delivery is not None:
            shop.free_delivery = shop_data.free_delivery
        if shop_data.is_active is not None:
            shop.is_active = shop_data.is_active

        db.add(shop)
        db.commit()
        db.refresh(shop)

        # Sync sellers table with updated shop data (including banners)
        sync_seller_profile(db, shop.id, shop.full_name, shop.business_name,
                          shop.shop_page_banner, shop.shop_detail_banner)

        return ShopRead(
            id=shop.id,
            business_name=shop.business_name,
            full_name=shop.full_name,
            shop_description=shop.shop_description,
            shop_page_banner=shop.shop_page_banner,
            shop_detail_banner=shop.shop_detail_banner,
            is_featured=shop.is_featured,
            is_verified=shop.is_verified,
            free_delivery=shop.free_delivery,
            is_active=shop.is_active,
            email=shop.email,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/shops/{shop_id}/banner/{banner_type}")
def delete_shop_banner(
    shop_id: int,
    banner_type: str,  # 'shop_page' or 'shop_detail'
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Delete shop banner - Admin only."""
    try:
        if banner_type not in ['shop_page', 'shop_detail']:
            raise HTTPException(status_code=400, detail="Invalid banner type")

        shop = db.get(User, shop_id)
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")

        if banner_type == 'shop_page':
            shop.shop_page_banner = None
        elif banner_type == 'shop_detail':
            shop.shop_detail_banner = None

        db.add(shop)
        db.commit()
        db.refresh(shop)

        return {"message": f"{banner_type} banner deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/users/{user_id}", response_model=User)
def update_user_admin(
    user_id: int,
    user_data: UserAdminUpdate,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Update any user/account or shop details (Admin only).
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = user_data.model_dump(exclude_unset=True)

        # Uniqueness checks
        if "email" in update_data and update_data["email"] != user.email:
            existing = db.query(User).filter(User.email == update_data["email"]).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")

        if "phone" in update_data and update_data["phone"] != user.phone:
            existing = db.query(User).filter(User.phone == update_data["phone"]).first()
            if existing:
                raise HTTPException(status_code=400, detail="Phone number already registered")

        # Password update
        if "password" in update_data:
            pw = update_data.pop("password")
            if pw:
                from app.core.security import get_password_hash
                user.hashed_password = get_password_hash(pw)

        # Apply other updates
        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)

        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

