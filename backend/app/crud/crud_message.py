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
        for msg, user_obj in results:
            other_user_id = user_obj.id
            if other_user_id not in conversations:
                conversations[other_user_id] = {
                    "other_user_id": other_user_id,
                    "other_user_name": user_obj.full_name,
                    "is_verified": user_obj.is_verified,
                    "last_message": msg.content,
                    "created_at": msg.created_at,
                    "listing_id": msg.listing_id
                }
        
        return list(conversations.values())

crud_message = CRUDMessage()
