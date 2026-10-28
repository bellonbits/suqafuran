"""
WebSocket endpoint for real-time chat (messages, typing indicators, presence).
"""
import uuid
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Dict, Set

from app.api import deps
from app.models.user import User
from app.crud.crud_message import crud_message

# Import manager from the correct location
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))
from services.websocket_service import manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])

# Track typing status per conversation: {(user_id, other_user_id): is_typing}
typing_status: Dict[tuple, bool] = {}


@router.websocket("/ws/chat")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(deps.get_db),
):
    """
    WebSocket endpoint for real-time chat.
    Handles: message delivery, typing indicators, and presence.
    """
    connection_id = str(uuid.uuid4())

    # Authenticate user from token
    try:
        current_user = deps.get_current_user_from_token(token, db)
        if not current_user:
            await websocket.close(code=4001, reason="Unauthorized")
            return
        user_id = current_user.id
    except Exception as e:
        logger.error(f"WebSocket auth failed: {e}")
        try:
            await websocket.close(code=4001, reason="Unauthorized")
        except:
            pass
        return

    # Connect
    await manager.connect(str(user_id), connection_id, websocket)
    await manager.send_presence_update(str(user_id), status="online")

    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("event_type")

            if event_type == "subscribe":
                # Subscribe to conversation with another user
                other_user_id = data.get("other_user_id")
                if other_user_id:
                    channel = f"chat_{min(user_id, other_user_id)}_{max(user_id, other_user_id)}"
                    await manager.subscribe(connection_id, channel)
                    logger.info(f"User {user_id} subscribed to {channel}")

                    # Reply with the other user's *current* status immediately --
                    # presence broadcasts only cover status changes from here on,
                    # so without this the requester has no idea until it changes.
                    await websocket.send_json({
                        "event_type": "presence",
                        "user_id": other_user_id,
                        "status": "online" if manager.is_user_online(str(other_user_id)) else "offline",
                        "timestamp": datetime.utcnow().isoformat(),
                    })

            elif event_type == "unsubscribe":
                other_user_id = data.get("other_user_id")
                if other_user_id:
                    channel = f"chat_{min(user_id, other_user_id)}_{max(user_id, other_user_id)}"
                    await manager.unsubscribe(connection_id, channel)

            elif event_type == "typing":
                # User is typing
                other_user_id = data.get("other_user_id")
                if other_user_id:
                    channel = f"chat_{min(user_id, other_user_id)}_{max(user_id, other_user_id)}"
                    typing_status[(min(user_id, other_user_id), max(user_id, other_user_id))] = True

                    await manager.broadcast_to_channel(
                        channel,
                        {
                            "event_type": "user_typing",
                            "user_id": user_id,
                            "other_user_id": other_user_id,
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                        exclude_users=[str(user_id)],  # Don't send back to sender
                    )

            elif event_type == "stop_typing":
                # User stopped typing
                other_user_id = data.get("other_user_id")
                if other_user_id:
                    channel = f"chat_{min(user_id, other_user_id)}_{max(user_id, other_user_id)}"
                    typing_status[(min(user_id, other_user_id), max(user_id, other_user_id))] = False

                    await manager.broadcast_to_channel(
                        channel,
                        {
                            "event_type": "user_stopped_typing",
                            "user_id": user_id,
                            "other_user_id": other_user_id,
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                        exclude_users=[str(user_id)],
                    )

            elif event_type == "message":
                # New message - persist to DB and broadcast to receiver across channels
                other_user_id = data.get("other_user_id")
                content = data.get("content")
                listing_id = data.get("listing_id")

                if other_user_id and content:
                    from app.services.moderation_service import moderation_service
                    is_flagged, reason = moderation_service.analyze_message(db, current_user, content)
                    if is_flagged:
                        await websocket.send_json({
                            "event_type": "moderation_blocked",
                            "reason": reason,
                            "message": "Message blocked: Please keep all conversations in-app and avoid sharing phone numbers or advance payment requests.",
                        })
                        continue

                    # 1. Persist to PostgreSQL database to guarantee durability
                    try:
                        msg_obj = crud_message.create(
                            db,
                            obj_in={"receiver_id": other_user_id, "content": content, "listing_id": listing_id},
                            sender_id=user_id,
                        )
                        message_id = msg_obj.id
                    except Exception as e:
                        logger.error(f"Failed to persist WS message: {e}")
                        message_id = None

                    channel = f"chat_{min(user_id, other_user_id)}_{max(user_id, other_user_id)}"
                    now_iso = datetime.utcnow().isoformat()
                    sender_name = current_user.full_name or "Someone"
                    preview = content[:80]

                    # 2. Create in-app notification in DB
                    try:
                        from app.crud.crud_notification import crud_notification
                        crud_notification.create(
                            db,
                            obj_in={
                                "type": "message",
                                "data": {
                                    "message_id": message_id,
                                    "sender_id": user_id,
                                    "sender_name": sender_name,
                                    "content": content,
                                    "listing_id": listing_id,
                                    "message": f"New message from {sender_name}: \"{preview}\"",
                                    "action_url": f"/messages?userId={user_id}",
                                }
                            },
                            user_id=other_user_id
                        )
                    except Exception as e:
                        logger.warning(f"Failed to create WS in-app notification: {e}")

                    # 3. Broadcast to SSE & Notification WS (powers Bell, Toast, Chime)
                    try:
                        from app.services.kafka_service import ws_manager as notif_ws_manager
                        notif_event = {
                            "type": "message",
                            "payload": {
                                "id": f"msg_{message_id}" if message_id else f"ws_{now_iso}",
                                "type": "message",
                                "title": f"New message from {sender_name}",
                                "message": f"New message from {sender_name}: \"{preview}\"",
                                "sender_id": user_id,
                                "sender_name": sender_name,
                                "listing_id": listing_id,
                                "content": content,
                                "created_at": now_iso,
                                "action_url": f"/messages?userId={user_id}",
                            },
                            "timestamp": now_iso,
                        }
                        await notif_ws_manager.broadcast_to_user(other_user_id, notif_event)
                    except Exception as e:
                        logger.warning(f"Failed to broadcast WS notification: {e}")

                    # 4. Broadcast to Chat Channel AND directly to user
                    chat_msg = {
                        "event_type": "new_message",
                        "id": message_id,
                        "sender_id": user_id,
                        "receiver_id": other_user_id,
                        "content": content,
                        "listing_id": listing_id,
                        "timestamp": now_iso,
                        "created_at": now_iso,
                    }
                    await manager.broadcast_to_channel(
                        channel,
                        chat_msg,
                        exclude_users=[str(user_id)],
                    )
                    await manager.broadcast_to_user(str(other_user_id), chat_msg)

                    # 5. Clear typing status
                    typing_status[(min(user_id, other_user_id), max(user_id, other_user_id))] = False

    except WebSocketDisconnect:
        await manager.disconnect(str(user_id), connection_id)
        if not manager.is_user_online(str(user_id)):
            await manager.send_presence_update(str(user_id), status="offline")
        logger.info(f"User {user_id} WebSocket disconnected")

    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        await manager.disconnect(str(user_id), connection_id)
        if not manager.is_user_online(str(user_id)):
            await manager.send_presence_update(str(user_id), status="offline")
