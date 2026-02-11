from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api import deps
from app.crud.crud_message import crud_message
from app.models.message import Message

router = APIRouter()

@router.post("/", response_model=Message)
def send_message(
    *,
    db: Session = Depends(deps.get_db),
    message_in: dict,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Send a new message.
    """
    return crud_message.create(db, obj_in=message_in, sender_id=current_user.id)

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
