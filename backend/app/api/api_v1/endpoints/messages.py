import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, SQLModel
from app.api import deps
from app.crud.crud_message import crud_message
from app.models.message import Message
from app.services.moderation_service import moderation_service
from app.core.security import risk_security
from app.models.user import User
from app.services.user_notification_service import user_notification_service
from app.services.kafka_service import ws_manager as kafka_ws_manager

router = APIRouter()

# In-memory tracking of recent user activity timestamps (epoch seconds)
ACTIVE_USER_HEARTBEATS: Dict[int, float] = {}

def update_user_heartbeat(user_id: int) -> None:
    """Record user activity timestamp for presence detection."""
    ACTIVE_USER_HEARTBEATS[user_id] = time.time()

def is_user_online(user_id: int) -> bool:
    """
    Check if a user is currently online through any connection layer:
    1. Active Server-Sent Events (SSE) notification connection.
    2. Active notification WebSocket connection.
    3. Active chat WebSocket connection.
    4. HTTP activity heartbeat within the last 90 seconds.
    """
    # 1. Active SSE connection
    if user_id in kafka_ws_manager.user_sse_queues and len(kafka_ws_manager.user_sse_queues[user_id]) > 0:
        return True

    # 2. Active notification WebSocket
    if user_id in kafka_ws_manager.user_connections and len(kafka_ws_manager.user_connections[user_id]) > 0:
        return True

    # 3. Active chat WebSocket
    try:
        from services.websocket_service import manager as chat_manager
        if chat_manager.is_user_online(str(user_id)):
            return True
    except Exception:
        pass

    # 4. Recent activity within last 90 seconds
    last_seen = ACTIVE_USER_HEARTBEATS.get(user_id)
    if last_seen and (time.time() - last_seen) < 90:
        return True

    return False


class MessageCreate(SQLModel):
    receiver_id: int
    content: str
    listing_id: Optional[int] = None


@router.post("/", response_model=Message)
def send_message(
    *,
    db: Session = Depends(deps.get_db),
    message_in: MessageCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Send a new message.
    """
    update_user_heartbeat(current_user.id)

    # 1. Risk-Based Rate Limiting
    risk_security.check_messaging_limit(current_user)

    # 1b. Check if conversation thread is suspended
    existing_conversation = crud_message.get_conversation_for_pair(
        db, user_a_id=current_user.id, user_b_id=message_in.receiver_id, listing_id=message_in.listing_id
    )
    if existing_conversation and existing_conversation.status == "suspended":
        raise HTTPException(status_code=403, detail="This conversation has been suspended by Suqafuran support.")

    # 2. Content Moderation
    is_flagged, reason = moderation_service.analyze_message(db, current_user, message_in.content)
    if is_flagged:
        if reason == "phone_number_sharing_restricted":
            detail = "Message blocked: Phone numbers cannot be shared in chat. Keep all conversations in-app to protect against scams."
        elif reason == "off_platform_link_restricted":
            detail = "Message blocked: External links and WhatsApp redirects are prohibited. Please continue your discussion inside the app."
        elif reason == "advance_payment_prohibited":
            detail = "Message blocked: Requesting advance deposits or delivery fees upfront is prohibited. Inspect items in person before paying."
        else:
            detail = f"Message blocked due to security policy ({reason}). To maintain safety, avoid sharing external contact details."
        raise HTTPException(status_code=403, detail=detail)

    msg = crud_message.create(db, obj_in=message_in.model_dump(), sender_id=current_user.id)

    sender_name = current_user.full_name or "Someone"
    preview = msg.content[:80]

    # Queue notifications as background tasks to avoid blocking the response
    try:
        from app.tasks.notifications import send_message_notifications
        send_message_notifications.delay(
            message_id=msg.id,
            sender_id=current_user.id,
            sender_name=sender_name,
            receiver_id=message_in.receiver_id,
            content=msg.content,
            preview=preview,
            listing_id=msg.listing_id
        )
    except Exception:
        pass

    return msg


@router.post("/presence/heartbeat")
def record_heartbeat(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Keep current user presence alive.
    """
    update_user_heartbeat(current_user.id)
    return {"ok": True, "user_id": current_user.id}


@router.get("/presence/batch")
def get_presence_batch(
    *,
    user_ids: str = Query(..., description="Comma-separated user IDs"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get online presence for multiple user IDs in one request.
    """
    update_user_heartbeat(current_user.id)
    result = {}
    for uid_str in user_ids.split(","):
        try:
            uid = int(uid_str.strip())
            result[str(uid)] = is_user_online(uid)
        except ValueError:
            continue
    return result


@router.get("/users/{other_user_id}/presence")
def get_user_presence(
    *,
    other_user_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get real-time presence for a specific user.
    """
    update_user_heartbeat(current_user.id)
    online = is_user_online(other_user_id)
    return {
        "user_id": other_user_id,
        "is_online": online,
        "status": "online" if online else "offline",
    }


@router.get("/conversations", response_model=List[Any])
def get_my_conversations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all conversations for the current user with live presence status.
    """
    update_user_heartbeat(current_user.id)
    conversations = crud_message.get_user_conversations(db, user_id=current_user.id)
    for conv in conversations:
        conv["is_online"] = is_user_online(conv.get("other_user_id"))
    return conversations


@router.get("/{other_user_id}", response_model=List[Message])
def get_conversation(
    *,
    db: Session = Depends(deps.get_db),
    other_user_id: int,
    listing_id: int = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get messages between current user and another user.
    """
    update_user_heartbeat(current_user.id)
    return crud_message.get_conversation(
        db, user_id=current_user.id, other_user_id=other_user_id, listing_id=listing_id
    )


@router.post("/{other_user_id}/read")
def mark_read(
    *,
    db: Session = Depends(deps.get_db),
    other_user_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark all messages from other_user_id to current_user as read.
    """
    update_user_heartbeat(current_user.id)
    crud_message.mark_as_read(db, user_id=current_user.id, other_user_id=other_user_id)
    return {"ok": True}
