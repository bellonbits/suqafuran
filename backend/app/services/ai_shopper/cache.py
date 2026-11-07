import time
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# In-memory session fallback store: session_id -> {"expires_at": float, "data": dict}
_LOCAL_SESSION_STORE: Dict[str, Dict[str, Any]] = {}


def get_cached_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves session data from Redis or local in-memory fallback."""
    if not session_id:
        return None

    # Check local store
    entry = _LOCAL_SESSION_STORE.get(session_id)
    if entry:
        if time.time() < entry.get("expires_at", 0):
            return entry.get("data")
        else:
            _LOCAL_SESSION_STORE.pop(session_id, None)

    return None


def set_cached_session(session_id: str, data: Dict[str, Any], ttl_seconds: int = 3600) -> None:
    """Stores session data in Redis or local in-memory fallback."""
    if not session_id:
        return

    _LOCAL_SESSION_STORE[session_id] = {
        "expires_at": time.time() + ttl_seconds,
        "data": data,
    }


def delete_cached_session(session_id: str) -> None:
    """Removes a session."""
    if session_id in _LOCAL_SESSION_STORE:
        _LOCAL_SESSION_STORE.pop(session_id, None)

