"""
Distributed Real-time Event Broadcaster using Redis Pub/Sub.

Ensures real-time WebSocket and SSE notifications and chat messages are delivered
reliably across all worker processes, containers, and background Celery tasks.
"""

import asyncio
import json
import logging
import uuid
from typing import Dict, List, Optional, Set
from fastapi import WebSocket
from app.core.config import settings

logger = logging.getLogger("realtime_broadcaster")

CHANNEL_REALTIME = "suqafuran:realtime:events"


class RealtimeBroadcaster:
    def __init__(self):
        self.instance_id: str = str(uuid.uuid4())
        # user_id -> List of active WebSockets
        self.user_websockets: Dict[int, List[WebSocket]] = {}
        # user_id -> List of active SSE subscriber queues
        self.user_sse_queues: Dict[int, List[asyncio.Queue]] = {}
        # Event loop reference
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        # Background task handle for Redis subscriber
        self._subscriber_task: Optional[asyncio.Task] = None
        self._running: bool = False

    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop

    # --- Local Connection Lifecycle ---
    async def connect_user(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.user_websockets.setdefault(user_id, []).append(websocket)
        logger.info(f"[{self.instance_id[:8]}] User {user_id} WebSocket connected (Total local: {len(self.user_websockets[user_id])})")

    def disconnect_user(self, user_id: int, websocket: WebSocket):
        if user_id in self.user_websockets:
            if websocket in self.user_websockets[user_id]:
                self.user_websockets[user_id].remove(websocket)
            if not self.user_websockets[user_id]:
                del self.user_websockets[user_id]
        logger.info(f"[{self.instance_id[:8]}] User {user_id} WebSocket disconnected")

    def register_user_sse(self, user_id: int, queue: asyncio.Queue):
        self.user_sse_queues.setdefault(user_id, []).append(queue)
        logger.info(f"[{self.instance_id[:8]}] User {user_id} SSE registered (Total local: {len(self.user_sse_queues[user_id])})")

    def unregister_user_sse(self, user_id: int, queue: asyncio.Queue):
        if user_id in self.user_sse_queues:
            if queue in self.user_sse_queues[user_id]:
                self.user_sse_queues[user_id].remove(queue)
            if not self.user_sse_queues[user_id]:
                del self.user_sse_queues[user_id]
        logger.info(f"[{self.instance_id[:8]}] User {user_id} SSE unregistered")

    def is_user_online_locally(self, user_id: int) -> bool:
        ws_count = len(self.user_websockets.get(user_id, []))
        sse_count = len(self.user_sse_queues.get(user_id, []))
        return (ws_count + sse_count) > 0

    # --- Local Dispatch ---
    async def _dispatch_local(self, user_id: int, event_data: dict):
        """Dispatch event to local WebSocket and SSE connections for user_id."""
        # 1. WebSockets
        dead_sockets = []
        for ws in self.user_websockets.get(user_id, []):
            try:
                await ws.send_json(event_data)
            except Exception as e:
                logger.debug(f"Failed to send to socket for user {user_id}: {e}")
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect_user(user_id, ws)

        # 2. SSE Queues
        for q in self.user_sse_queues.get(user_id, []):
            try:
                q.put_nowait(event_data)
            except Exception as e:
                logger.debug(f"Failed to queue SSE for user {user_id}: {e}")

    # --- Cross-Worker Publish ---
    async def broadcast_to_user(self, user_id: int, event_data: dict):
        """
        Broadcast an event to user_id locally AND across all worker instances via Redis.
        """
        # 1. Deliver to local clients immediately
        await self._dispatch_local(user_id, event_data)

        # 2. Publish to Redis for other worker instances
        payload = json.dumps({
            "origin": self.instance_id,
            "user_id": user_id,
            "event": event_data,
        })
        try:
            import redis.asyncio as aioredis
            redis_conn = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            try:
                await redis_conn.publish(CHANNEL_REALTIME, payload)
            finally:
                await redis_conn.aclose()
        except Exception as e:
            # Fallback gracefully if Redis is unreachable in local dev / test
            logger.debug(f"Redis publish skipped or failed: {e}")

    def broadcast_to_user_from_thread(self, user_id: int, event_data: dict):
        """Thread-safe call from synchronous handlers or Celery workers."""
        loop = self.loop
        if not loop or not loop.is_running():
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = None

        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(
                self.broadcast_to_user(user_id, event_data),
                loop
            )
        else:
            # Synchronous fallback: publish directly to Redis via sync client
            try:
                from app.utils.redis import redis_client
                payload = json.dumps({
                    "origin": self.instance_id,
                    "user_id": user_id,
                    "event": event_data,
                })
                redis_client.publish(CHANNEL_REALTIME, payload)
            except Exception as e:
                logger.debug(f"Sync Redis publish failed: {e}")

    # --- Background Redis Subscriber ---
    async def start_subscriber(self):
        """Start background loop listening to Redis realtime channel."""
        if self._running:
            return
        self._running = True
        self._subscriber_task = asyncio.create_task(self._subscriber_loop())
        logger.info(f"[{self.instance_id[:8]}] Started Redis realtime subscriber task")

    async def stop_subscriber(self):
        self._running = False
        if self._subscriber_task:
            self._subscriber_task.cancel()
            try:
                await self._subscriber_task
            except asyncio.CancelledError:
                pass
            self._subscriber_task = None
        logger.info(f"[{self.instance_id[:8]}] Stopped Redis realtime subscriber task")

    async def _subscriber_loop(self):
        import redis.asyncio as aioredis
        while self._running:
            try:
                redis_conn = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                pubsub = redis_conn.pubsub()
                await pubsub.subscribe(CHANNEL_REALTIME)
                logger.info(f"[{self.instance_id[:8]}] Subscribed to Redis channel {CHANNEL_REALTIME}")

                while self._running:
                    try:
                        message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                        if message and message.get("type") == "message":
                            raw_data = message.get("data")
                            if raw_data:
                                parsed = json.loads(raw_data)
                                origin = parsed.get("origin")
                                # Ignore events that originated from this instance
                                if origin != self.instance_id:
                                    target_user_id = parsed.get("user_id")
                                    event = parsed.get("event")
                                    if target_user_id and event:
                                        await self._dispatch_local(int(target_user_id), event)
                    except asyncio.CancelledError:
                        raise
                    except Exception as loop_err:
                        logger.debug(f"Error in pubsub message dispatch: {loop_err}")
                        await asyncio.sleep(0.5)

            except asyncio.CancelledError:
                break
            except Exception as conn_err:
                logger.debug(f"Redis subscriber connection retry in 3s: {conn_err}")
                await asyncio.sleep(3.0)


# Global singleton instance
broadcaster = RealtimeBroadcaster()

