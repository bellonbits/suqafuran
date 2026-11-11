"""Admin endpoints for sending system messages to users."""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, or_
from pydantic import BaseModel
from app.api import deps
from app.models.user import User
from app.services.system_messaging_service import send_system_message, send_bulk_system_message
from app.core.logging_config import get_logger

logger = get_logger("admin_system_messaging")

router = APIRouter()


class SendSystemMessageRequest(BaseModel):
    recipient_user_id: Optional[int] = None
    recipient_name: Optional[str] = None
    recipient: Optional[str] = None  # Full name, business name, email, phone, or ID
    message: str
    message_type: str = "general"  # general, promotional, announcement, support


class SendBulkMessageRequest(BaseModel):
    recipient_user_ids: Optional[list[int]] = None
    recipient_names: Optional[list[str]] = None
    recipients: Optional[list[str]] = None  # List of names, emails, or IDs
    message: str
    message_type: str = "general"
    dry_run: bool = False  # If True, only validates but doesn't send


class SendBulkMessageResponse(BaseModel):
    success: int
    failed: int
    errors: Optional[list] = None


def _check_admin_permission(current_user: User):
    """Verify user has admin permission."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can send system messages"
        )


def _resolve_user(db: Session, recipient_id: Optional[int] = None, recipient_term: Optional[str] = None) -> User:
    """Find a user by numeric ID, full name, business name, email, or phone."""
    if recipient_id:
        user = db.get(User, recipient_id)
        if user:
            return user

    term = (recipient_term or "").strip()
    if not term:
        raise HTTPException(status_code=400, detail="Please provide a recipient name or user ID")

    # If numeric string
    if term.isdigit():
        user = db.get(User, int(term))
        if user:
            return user

    # 1. Exact match on full_name, business_name, or email
    user = db.exec(
        select(User).where(
            or_(
                User.full_name.ilike(term),
                User.business_name.ilike(term),
                User.email.ilike(term),
            )
        )
    ).first()
    if user:
        return user

    # 2. Case-insensitive substring match
    pattern = f"%{term}%"
    user = db.exec(
        select(User).where(
            or_(
                User.full_name.ilike(pattern),
                User.business_name.ilike(pattern),
                User.email.ilike(pattern),
                User.phone.ilike(pattern),
            )
        )
    ).first()
    if user:
        return user

    raise HTTPException(
        status_code=404,
        detail=f"User '{term}' not found. Please search and select by name from the list."
    )


@router.get("/search-users")
def search_users_by_name(
    query: str = Query(..., min_length=1, description="Search users by name, business name, phone, or email"),
    limit: int = 15,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Search users dynamically by name, business name, phone, or email for messaging."""
    _check_admin_permission(current_user)

    q = query.strip()
    pattern = f"%{q}%"

    conditions = [
        User.full_name.ilike(pattern),
        User.business_name.ilike(pattern),
        User.email.ilike(pattern),
        User.phone.ilike(pattern),
    ]
    if q.isdigit():
        conditions.append(User.id == int(q))

    statement = select(User).where(or_(*conditions)).limit(limit)
    users = db.exec(statement).all()

    return [
        {
            "id": u.id,
            "name": u.full_name or u.business_name or f"User #{u.id}",
            "full_name": u.full_name,
            "business_name": u.business_name,
            "email": u.email,
            "phone": u.phone,
            "is_seller": bool(u.is_seller or u.business_name),
            "role": "Seller" if (u.is_seller or u.business_name) else "Buyer",
            "avatar": getattr(u, "avatar_url", None),
        }
        for u in users
    ]


@router.post("/send")
def send_system_message_endpoint(
    payload: SendSystemMessageRequest,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Send a system message from Suqafuran to a user by name, email, or ID.
    """
    _check_admin_permission(current_user)

    if not payload.message or len(payload.message.strip()) < 1:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if len(payload.message) > 5000:
        raise HTTPException(status_code=400, detail="Message too long (max 5000 characters)")

    # Resolve target recipient by name or ID
    target_user = _resolve_user(
        db,
        recipient_id=payload.recipient_user_id,
        recipient_term=payload.recipient or payload.recipient_name,
    )

    try:
        msg = send_system_message(
            db=db,
            recipient_user_id=target_user.id,
            message_content=payload.message,
            message_type=payload.message_type
        )

        return {
            "status": "sent",
            "message_id": msg.id,
            "recipient_id": target_user.id,
            "recipient_name": target_user.full_name or target_user.business_name or f"User #{target_user.id}",
            "message_type": payload.message_type
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to send system message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )


@router.post("/send-bulk", response_model=SendBulkMessageResponse)
def send_bulk_system_message_endpoint(
    payload: SendBulkMessageRequest,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Send a system message to multiple users resolved by name, email, or user IDs.
    """
    _check_admin_permission(current_user)

    if not payload.message or len(payload.message.strip()) < 1:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if len(payload.message) > 5000:
        raise HTTPException(status_code=400, detail="Message too long (max 5000 characters)")

    # Resolve all recipient IDs from names or raw IDs
    resolved_ids: list[int] = list(payload.recipient_user_ids or [])
    name_inputs = (payload.recipients or []) + (payload.recipient_names or [])

    unresolved_names = []
    for item in name_inputs:
        item_str = str(item).strip()
        if not item_str:
            continue
        try:
            u = _resolve_user(db, recipient_term=item_str)
            resolved_ids.append(u.id)
        except Exception:
            unresolved_names.append(item_str)

    if not resolved_ids:
        err_msg = "At least one valid recipient is required."
        if unresolved_names:
            err_msg += f" Could not find users: {', '.join(unresolved_names)}"
        raise HTTPException(status_code=400, detail=err_msg)

    unique_ids = list(set(resolved_ids))

    if len(unique_ids) > 10000:
        raise HTTPException(status_code=400, detail="Too many recipients (max 10,000)")

    if payload.dry_run:
        return {
            "success": len(unique_ids),
            "failed": len(unresolved_names),
            "errors": [{"error": f"User not found: {n}"} for n in unresolved_names] if unresolved_names else None
        }

    try:
        result = send_bulk_system_message(
            db=db,
            recipient_user_ids=unique_ids,
            message_content=payload.message,
            message_type=payload.message_type
        )

        if unresolved_names:
            errors = result.get("errors") or []
            for n in unresolved_names:
                errors.append({"user": n, "error": "User not found by name"})
            result["errors"] = errors
            result["failed"] = result.get("failed", 0) + len(unresolved_names)

        logger.info(
            f"Bulk system message sent: {result['success']} success, "
            f"{result['failed']} failed. Type: {payload.message_type}"
        )

        return result

    except Exception as e:
        logger.error(f"Failed to send bulk system messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send messages"
        )


class BroadcastNotificationRequest(BaseModel):
    title: str
    message: str
    audience: str = "all"  # "all", "sellers", "buyers"
    action_url: Optional[str] = None
    image_url: Optional[str] = None


@router.post("/broadcast")
def broadcast_push_notification(
    payload: BroadcastNotificationRequest,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Broadcast a push notification to all users/devices with the app.
    Supports audience targeting ('all', 'sellers', 'buyers').
    """
    _check_admin_permission(current_user)

    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Notification title is required")

    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Notification message cannot be empty")

    from app.utils.push import broadcast_push_to_all
    result = broadcast_push_to_all(
        db,
        title=payload.title.strip(),
        body=payload.message.strip(),
        data={"path": payload.action_url or "/"},
        image_url=payload.image_url,
        audience=payload.audience,
    )

    return {
        "status": "success",
        "message": f"Broadcast sent to {result['tokens_dispatched']} device(s)",
        "details": result,
    }

