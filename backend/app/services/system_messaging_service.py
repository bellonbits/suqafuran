"""Service for sending system messages from Suqafuran to users."""

import logging
from typing import Optional
from sqlmodel import Session, select
from app.models.user import User
from app.models.message import Message
from app.crud.crud_message import crud_message
from app.crud.crud_notification import crud_notification

logger = logging.getLogger("system_messaging_service")

# System user ID - should be a reserved ID (1 or a high reserved range)
SYSTEM_USER_ID = 1  # Reserved for Suqafuran system messages
SYSTEM_USER_NAME = "Suqafuran"
SYSTEM_USER_EMAIL = "system@suqafuran.com"


def get_or_create_system_user(db: Session) -> User:
    """Get or create the system user for Suqafuran messages."""
    system_user = db.exec(select(User).where(User.email == SYSTEM_USER_EMAIL)).first()

    if not system_user:
        user_1 = db.get(User, SYSTEM_USER_ID)
        if user_1:
            system_user = user_1
        else:
            system_user = User(
                id=SYSTEM_USER_ID,
                email=SYSTEM_USER_EMAIL,
                full_name=SYSTEM_USER_NAME,
                password="",
                is_verified=True,
                verified_level="tier3",
                is_seller=False,
                phone_verified=True,
                email_verified=True,
            )
            db.add(system_user)
            db.commit()
            db.refresh(system_user)

    return system_user


def send_system_message(
    db: Session,
    recipient_user_id: int,
    message_content: str,
    message_type: str = "general"  # general, promotional, announcement, support
) -> Message:
    """
    Send a system message from Suqafuran to a user.

    Args:
        db: Database session
        recipient_user_id: User receiving the message
        message_content: Message text
        message_type: Type of system message for categorization

    Returns:
        The created Message
    """
    try:
        system_user = get_or_create_system_user(db)
        recipient = db.get(User, recipient_user_id)

        if not recipient:
            raise ValueError(f"User {recipient_user_id} not found")

        # Create message in real marketplace chat (table: message & marketplace_conversation)
        msg = crud_message.create(
            db,
            obj_in={
                "receiver_id": recipient_user_id,
                "content": message_content,
                "listing_id": None,
            },
            sender_id=system_user.id
        )

        # Also create in-app notification and trigger push notification
        try:
            crud_notification.create(
                db,
                obj_in={
                    "type": "system_message",
                    "title": f"Suqafuran {message_type.capitalize()}",
                    "message": message_content,
                    "data": {
                        "title": f"Suqafuran {message_type.capitalize()}",
                        "message": message_content,
                        "action_url": f"/messages?userId={system_user.id}",
                        "message_type": message_type,
                    }
                },
                user_id=recipient_user_id,
            )
        except Exception as notify_err:
            logger.warning(f"Could not create notification for system message: {notify_err}")

        logger.info(f"System message sent to user {recipient_user_id}: {message_type}")
        return msg

    except Exception as e:
        logger.error(f"Failed to send system message to user {recipient_user_id}: {e}")
        db.rollback()
        raise


def send_bulk_system_message(
    db: Session,
    recipient_user_ids: list[int],
    message_content: str,
    message_type: str = "general"
) -> dict:
    """
    Send a system message to multiple users.

    Args:
        db: Database session
        recipient_user_ids: List of user IDs
        message_content: Message text
        message_type: Type of system message

    Returns:
        Dict with success/failure counts
    """
    success_count = 0
    failure_count = 0
    errors = []

    for user_id in recipient_user_ids:
        try:
            send_system_message(db, user_id, message_content, message_type)
            success_count += 1
        except Exception as e:
            failure_count += 1
            errors.append({"user_id": user_id, "error": str(e)})
            logger.warning(f"Failed to send message to user {user_id}: {e}")

    logger.info(f"Bulk system messages: {success_count} sent, {failure_count} failed")
    return {
        "success": success_count,
        "failed": failure_count,
        "errors": errors if errors else None
    }
