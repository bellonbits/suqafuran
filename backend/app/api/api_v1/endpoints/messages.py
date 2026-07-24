from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, SQLModel
from app.api import deps
from app.crud.crud_message import crud_message
from app.models.message import Message
from app.services.moderation_service import moderation_service
from app.core.security import risk_security
from app.models.user import User
from app.services.user_notification_service import user_notification_service
from app.crud.crud_user import crud_user

router = APIRouter()

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
    # 1. Risk-Based Rate Limiting
    risk_security.check_messaging_limit(current_user)
    
    # 2. Content Moderation
    is_flagged, reason = moderation_service.analyze_message(db, current_user, message_in.content)
    if is_flagged:
        raise HTTPException(
            status_code=403, 
            detail=f"Message blocked due to suspicious content: {reason}. To maintain safety, avoid sharing phone numbers or external links."
        )

    msg = crud_message.create(db, obj_in=message_in.model_dump(), sender_id=current_user.id)

    sender_name = current_user.full_name or "Someone"
    preview = msg.content[:80]

    # In-app notification
    from app.crud.crud_notification import crud_notification
    try:
        crud_notification.create(
            db,
            obj_in={
                "type": "message",
                "data": {
                    "message_id": msg.id,
                    "sender_id": current_user.id,
                    "sender_name": sender_name,
                    "content": msg.content,
                    "listing_id": msg.listing_id,
                    "message": f"New message from {sender_name}: \"{preview}\""
                }
            },
            user_id=message_in.receiver_id
        )
    except Exception:
        pass

    # Push notification
    from app.utils.push import send_push_to_user
    send_push_to_user(
        db,
        user_id=message_in.receiver_id,
        title=f"New message from {sender_name}",
        body=preview,
        data={
            "type": "message",
            "sender_id": str(current_user.id),
            "listing_id": str(msg.listing_id or ""),
            "path": f"/messages/{current_user.id}",
        }
    )

    # Email notification
    try:
        receiver = crud_user.get(db, id=message_in.receiver_id)
        if receiver:
            user_notification_service.notify_new_message(
                receiver=receiver,
                sender_name=sender_name,
                message_content=msg.content,
            )
    except Exception as e:
        pass

    return msg


@router.get("/conversations", response_model=List[Any])
def get_my_conversations(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all conversations for the current user.
    """
    return crud_message.get_user_conversations(db, user_id=current_user.id)

@router.get("/{other_user_id}", response_model=List[Message])
def get_conversation(
    *,
    db: Session = Depends(deps.get_db),
    other_user_id: int,
    listing_id: int = None,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get messages between current user and another user.
    """
    return crud_message.get_conversation(
        db, user_id=current_user.id, other_user_id=other_user_id, listing_id=listing_id
    )

@router.post("/{other_user_id}/read")
def mark_read(
    *,
    db: Session = Depends(deps.get_db),
    other_user_id: int,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark all messages from other_user_id to current_user as read.
    """
    crud_message.mark_as_read(db, user_id=current_user.id, other_user_id=other_user_id)
    return {"ok": True}
