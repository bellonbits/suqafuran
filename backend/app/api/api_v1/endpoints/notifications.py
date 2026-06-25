import asyncio
import logging
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from jose import jwt
from sqlmodel import Session
from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud.crud_notification import crud_notification
from app.services.kafka_service import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[Any])
def get_my_notifications(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all notifications for the current user.
    """
    return crud_notification.get_user_notifications(db, user_id=current_user.id)

@router.post("/{notification_id}/read")
def mark_notification_read(
    *,
    db: Session = Depends(deps.get_db),
    notification_id: int,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark a notification as read.
    """
    notification = crud_notification.mark_as_read(
        db, notification_id=notification_id, user_id=current_user.id
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.post("/read-all")
def mark_all_notifications_read(
    *,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark all notifications of current user as read.
    """
    count = crud_notification.mark_all_as_read(db, user_id=current_user.id)
    return {"message": "Success", "updated_count": count}

@router.delete("/{notification_id}")
def delete_notification(
    *,
    db: Session = Depends(deps.get_db),
    notification_id: int,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a notification.
    """
    success = crud_notification.remove(db, notification_id=notification_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Success"}


@router.websocket("/ws")
async def notifications_websocket(websocket: WebSocket):
    """
    Personal real-time channel, one per logged-in user (multiple tabs/devices
    all stay connected). Authenticate via ?token=<JWT> query param — browsers'
    native WebSocket API can't send custom headers, so the token travels in
    the URL like the existing business-chat socket does.

    Once connected, the server pushes any event addressed to this user_id
    (e.g. an order status change from a seller) with no polling required.
    """
    token = websocket.query_params.get("token")
    user_id = None
    if token:
        try:
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
            user_id = int(decoded.get("sub"))
        except Exception:
            user_id = None

    if not user_id:
        await websocket.accept()
        await websocket.send_json({"error": "Unauthorized: invalid or missing token"})
        await websocket.close(code=4401)
        return

    await ws_manager.connect_user(user_id, websocket)
    if ws_manager.loop is None:
        ws_manager.set_event_loop(asyncio.get_event_loop())

    try:
        while True:
            # This channel is push-only from the server; we just keep the
            # socket open and detect disconnects. Any inbound text (e.g. a
            # client ping) is read and discarded.
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_user(user_id, websocket)
    except Exception as e:
        logger.error(f"Notifications WebSocket error for user {user_id}: {e}")
        ws_manager.disconnect_user(user_id, websocket)

