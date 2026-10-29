import asyncio
import json
import logging
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect, status
from fastapi.responses import StreamingResponse
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
    unread_only: bool = Query(default=False),
) -> Any:
    """
    Get notifications for the current user. Supports unread_only filtering.
    """
    return crud_notification.get_user_notifications(db, user_id=current_user.id, unread_only=unread_only)

@router.post("/clear-all")
@router.delete("/clear-all")
def clear_all_notifications(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Permanently delete all notifications for the current user.
    """
    deleted_count = crud_notification.clear_all(db, user_id=current_user.id)
    return {"message": "Success", "deleted_count": deleted_count}

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

@router.delete("/{notification_id:int}")
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
    logger.info(f"[WebSocket] Connection attempt from {websocket.client}")
    token = websocket.query_params.get("token")
    user_id = None

    if token:
        try:
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
            sub = decoded.get("sub")
            # Handle both string and int user IDs
            user_id = int(sub) if sub else None
            logger.info(f"[WebSocket] Token validated successfully for user {user_id}")
        except jwt.ExpiredSignatureError:
            logger.warning("[WebSocket] Token validation failed: token has expired")
            user_id = None
        except jwt.JWTError as e:
            logger.warning(f"[WebSocket] Token validation failed: {str(e)}")
            user_id = None
        except Exception as e:
            logger.error(f"[WebSocket] Unexpected auth verification error: {str(e)}")
            user_id = None
    else:
        logger.warning("[WebSocket] No token provided in query params")

    if not user_id:
        try:
            await websocket.accept()
            await websocket.send_json({"error": "Unauthorized: invalid or missing token"})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        except Exception as e:
            logger.warning(f"[WebSocket] Error rejecting unauthorized socket: {e}")
        return

    try:
        await ws_manager.connect_user(user_id, websocket)
        logger.info(f"[WebSocket] Accepted connection for user {user_id}")
        await websocket.send_json({
            "type": "connection",
            "payload": {"status": "connected", "user_id": user_id}
        })
    except Exception as e:
        logger.error(f"[WebSocket] Failed to register connection for user {user_id}: {e}")
        return

    if ws_manager.loop is None:
        ws_manager.set_event_loop(asyncio.get_event_loop())

    try:
        logger.info(f"[WebSocket] User {user_id} connected, listening for messages...")
        while True:
            try:
                # 45s timeout to stay well under Cloudflare's 100s idle timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=45)
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                except Exception:
                    pass
            except asyncio.TimeoutError:
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    break
            except Exception:
                break
    except WebSocketDisconnect:
        logger.info(f"[WebSocket] User {user_id} disconnected normally")
    except Exception as e:
        logger.error(f"[WebSocket] Error for user {user_id}: {e}")
    finally:
        ws_manager.disconnect_user(user_id, websocket)


@router.get("/sse")
async def notifications_sse(
    request: Request,
    token: str = Query(..., description="JWT authentication token"),
):
    """
    Server-Sent Events (SSE) streaming endpoint for real-time notifications.
    Operates over standard HTTPS and avoids browser WebSocket blocks, proxy buffering,
    or extension CSP interference. Automatically reconnects via standard EventSource.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        sub = decoded.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user_id = int(sub)
    except Exception as e:
        logger.warning(f"[SSE] Token validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    queue: asyncio.Queue = asyncio.Queue()
    ws_manager.register_user_sse(user_id, queue)
    if ws_manager.loop is None:
        ws_manager.set_event_loop(asyncio.get_event_loop())

    async def event_generator():
        try:
            init_payload = json.dumps({"status": "connected", "user_id": user_id, "type": "connection"})
            yield f"event: connection\ndata: {init_payload}\n\n"

            while True:
                if await request.is_disconnected():
                    break
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"event: notification\ndata: {json.dumps(message)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        except Exception as e:
            logger.debug(f"[SSE] User {user_id} stream disconnected: {e}")
        finally:
            ws_manager.unregister_user_sse(user_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


