from typing import List, Optional
from sqlmodel import Session, select, or_, and_
from app.models.message import Message
from datetime import datetime

class CRUDMessage:
    def create(self, db: Session, *, obj_in: dict, sender_id: int) -> Message:
        db_obj = Message(
            sender_id=sender_id,
            receiver_id=obj_in["receiver_id"],
            listing_id=obj_in.get("listing_id"),
            content=obj_in["content"]
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_conversation(
        self, db: Session, *, user_id: int, other_user_id: int, listing_id: Optional[int] = None
    ) -> List[Message]:
        statement = select(Message).where(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == user_id)
            )
        )
        if listing_id:
            statement = statement.where(Message.listing_id == listing_id)
        
        statement = statement.order_by(Message.created_at)
        return db.exec(statement).all()

    def get_user_conversations(self, db: Session, *, user_id: int) -> List[dict]:
        from app.models.user import User
        # Fetch messages involving the user and join with the other participant's profile
        statement = select(Message, User).where(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        ).join(
            User, 
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == User.id),
                and_(Message.receiver_id == user_id, Message.sender_id == User.id)
            )
        ).order_by(Message.created_at.desc())
        
        results = db.exec(statement).all()
        
        conversations = {}
        unread_counts: dict = {}
        for msg, user_obj in results:
            other_id = user_obj.id
            if other_id not in conversations:
                conversations[other_id] = {
                    "other_user_id": other_id,
                    "other_user_name": user_obj.full_name,
                    "other_user_avatar": user_obj.avatar_url,
                    "last_message": msg.content,
                    "last_message_at": msg.created_at.isoformat() if msg.created_at else None,
                    "unread_count": 0,
                    "listing_id": msg.listing_id,
                }
            # Count unread messages sent to the current user
            if msg.receiver_id == user_id and not msg.is_read:
                conversations[other_id]["unread_count"] = conversations[other_id].get("unread_count", 0) + 1

        return list(conversations.values())

crud_message = CRUDMessage()
