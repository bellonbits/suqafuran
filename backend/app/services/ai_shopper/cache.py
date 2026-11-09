import time
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# In-memory session fallback store: session_id -> {"expires_at": float, "data": dict}
_LOCAL_SESSION_STORE: Dict[str, Dict[str, Any]] = {}


def _get_redis():
    try:
        from app.utils.redis import redis_client
        return redis_client
    except Exception as e:
        logger.debug(f"Redis not available for ai_shopper session cache: {e}")
        return None


def get_cached_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves session data from Redis with local in-memory fallback."""
    if not session_id:
        return None

    # 1. Try Redis first
    r = _get_redis()
    if r:
        try:
            val = r.get(f"ai_shopper:session:{session_id}")
            if val:
                return json.loads(val)
        except Exception as e:
            logger.debug(f"Redis get failed, checking local store: {e}")

    # 2. Check local memory store
    entry = _LOCAL_SESSION_STORE.get(session_id)
    if entry:
        if time.time() < entry.get("expires_at", 0):
            return entry.get("data")
        else:
            _LOCAL_SESSION_STORE.pop(session_id, None)

    return None


def set_cached_session(session_id: str, data: Dict[str, Any], ttl_seconds: int = 3600) -> None:
    """Stores session data in Redis with local in-memory fallback."""
    if not session_id:
        return

    # 1. Try Redis
    r = _get_redis()
    if r:
        try:
            r.setex(f"ai_shopper:session:{session_id}", ttl_seconds, json.dumps(data))
        except Exception as e:
            logger.debug(f"Redis set failed: {e}")

    # 2. Always maintain local memory store for resilience
    _LOCAL_SESSION_STORE[session_id] = {
        "expires_at": time.time() + ttl_seconds,
        "data": data,
    }


def delete_cached_session(session_id: str) -> None:
    """Removes a session from Redis and local memory store."""
    r = _get_redis()
    if r:
        try:
            r.delete(f"ai_shopper:session:{session_id}")
        except Exception as e:
            logger.debug(f"Redis delete failed: {e}")

    if session_id in _LOCAL_SESSION_STORE:
        _LOCAL_SESSION_STORE.pop(session_id, None)


