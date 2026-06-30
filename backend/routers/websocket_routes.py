"""
WebSocket Routes - Real-time connection and event handling
"""
import uuid
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import DeviceToken, User, RealtimeEvent
from schemas_websocket import DeviceTokenRegister, DeviceTokenResponse, RealtimeEventLog
from utils.security import get_current_user
from services.websocket_service import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["websocket"])


# Device Token Routes
@router.post("/device-tokens/register", response_model=DeviceTokenResponse)
async def register_device_token(
    token_data: DeviceTokenRegister,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Register device token for push notifications"""
    try:
        # Check if token already exists
        existing = (
            db.query(DeviceToken)
            .filter(DeviceToken.token == token_data.token)
            .first()
        )

        if existing:
            # Update existing token
            existing.device_type = token_data.device_type
            existing.device_name = token_data.device_name
            existing.is_active = True
            existing.last_used = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing

        # Create new token
        new_token = DeviceToken(
            user_id=current_user.id,
            token=token_data.token,
            device_type=token_data.device_type,
            device_name=token_data.device_name,
        )
        db.add(new_token)
        db.commit()
        db.refresh(new_token)

        logger.info(f"Device token registered for user {current_user.id}")
        return new_token
    except Exception as e:
        logger.error(f"Error registering device token: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/device-tokens", response_model=list[DeviceTokenResponse])
async def list_device_tokens(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all device tokens for current user"""
    tokens = (
        db.query(DeviceToken)
        .filter(DeviceToken.user_id == current_user.id, DeviceToken.is_active)
        .all()
    )
    return tokens


@router.delete("/device-tokens/{token_id}")
async def revoke_device_token(
    token_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke device token"""
    token = (
        db.query(DeviceToken)
        .filter(
            DeviceToken.id == token_id,
            DeviceToken.user_id == current_user.id,
        )
        .first()
    )

    if not token:
        raise HTTPException(status_code=404, detail="Token not found")

    token.is_active = False
    db.commit()

    return {"success": True, "message": "Token revoked"}


# Real-time Events Log
@router.get("/realtime-events", response_model=list[RealtimeEventLog])
async def get_realtime_events(
    event_type: str = Query(None),
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get real-time events log for current user"""
    query = db.query(RealtimeEvent).filter(RealtimeEvent.user_id == current_user.id)

    if event_type:
        query = query.filter(RealtimeEvent.event_type == event_type)

    events = (
        query.order_by(RealtimeEvent.created_at.desc())
        .limit(limit)
        .all()
    )

    return events


# WebSocket Connection Status
@router.get("/websocket/status")
async def websocket_status(
    current_user: User = Depends(get_current_user),
):
    """Get WebSocket connection status for current user"""
    is_online = manager.is_user_online(current_user.id)
    connections = manager.get_user_connections(current_user.id)

    return {
        "user_id": current_user.id,
        "is_online": is_online,
        "connection_count": len(connections),
        "connections": [
            manager.get_connection_info(cid) for cid in connections
        ],
    }


@router.get("/websocket/stats")
async def websocket_stats():
    """Get WebSocket connection statistics"""
    return manager.get_stats()


# WebSocket Connection Handler
@router.websocket("/ws/{token}")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for real-time updates

    Usage:
    1. Connect: ws://localhost:8000/api/v1/ws/{jwt_token}
    2. Subscribe: {"action": "subscribe", "channels": ["order_123", "delivery"]}
    3. Receive updates: {"event_type": "order_update", "order_id": "123", ...}
    """
    # Verify JWT token and get user
    try:
        from utils.security import verify_token
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001, reason="Invalid token")
            return

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=4002, reason="User not found")
            return
    except Exception as e:
        logger.error(f"WebSocket auth error: {str(e)}")
        await websocket.close(code=4003, reason="Authentication failed")
        return

    connection_id = str(uuid.uuid4())

    try:
        # Register connection
        await manager.connect(user_id, connection_id, websocket)

        # Log connection event
        event = RealtimeEvent(
            user_id=user_id,
            event_type="connection",
            event_data={
                "connection_id": connection_id,
                "action": "connected",
            },
        )
        db.add(event)
        db.commit()

        # Broadcast presence update
        await manager.send_presence_update(user_id, "online")

        # Listen for messages
        while True:
            data = await websocket.receive_json()

            action = data.get("action")

            if action == "subscribe":
                # Subscribe to channels
                channels = data.get("channels", [])
                for channel in channels:
                    await manager.subscribe(connection_id, channel)
                    logger.debug(f"User {user_id} subscribed to {channel}")

            elif action == "unsubscribe":
                # Unsubscribe from channels
                channels = data.get("channels", [])
                for channel in channels:
                    await manager.unsubscribe(connection_id, channel)
                    logger.debug(f"User {user_id} unsubscribed from {channel}")

            elif action == "ping":
                # Respond to ping (keep-alive)
                await websocket.send_json(
                    {
                        "event_type": "pong",
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                )

            else:
                logger.warning(f"Unknown action: {action}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnect: {user_id}:{connection_id}")
        await manager.disconnect(user_id, connection_id)

        # Log disconnection event
        event = RealtimeEvent(
            user_id=user_id,
            event_type="disconnection",
            event_data={
                "connection_id": connection_id,
                "action": "disconnected",
            },
        )
        db.add(event)
        db.commit()

        # Broadcast presence update if no other connections
        if not manager.is_user_online(user_id):
            await manager.send_presence_update(user_id, "offline")

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await manager.disconnect(user_id, connection_id)
