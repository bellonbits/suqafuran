"""
Redis-backed cache service.
Usage:
    from app.services.cache_service import cache

    # Get/set with TTL
    value = cache.get("my_key")
    cache.set("my_key", {"data": 1}, ttl=60)
    cache.delete_pattern("cache:listings:*")

    # Decorator
    @cache.cached(prefix="categories", ttl=300)
    def get_categories(db): ...
"""
import json
import hashlib
from functools import wraps
from typing import Any, Optional

import redis as redis_lib
from app.core.config import settings


from fastapi.encoders import jsonable_encoder

class CacheService:
    def __init__(self):
        self._client: Optional[redis_lib.Redis] = None

    @property
    def client(self) -> redis_lib.Redis:
        if self._client is None:
            self._client = redis_lib.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
        return self._client

    def get(self, key: str) -> Any:
        try:
            data = self.client.get(key)
            return json.loads(data) if data else None
        except Exception:
            return None  # Cache miss on Redis error — degrade gracefully

    def set(self, key: str, value: Any, ttl: int = 60) -> None:
        try:
            # Use jsonable_encoder to convert models/datetimes to JSON-compatible dicts/strings
            encoded_value = jsonable_encoder(value)
            self.client.setex(key, ttl, json.dumps(encoded_value))
        except Exception:
            pass  # Don't fail if Redis is unavailable

    def delete(self, key: str) -> None:
        try:
            self.client.delete(key)
        except Exception:
            pass

    def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching a glob pattern (e.g. 'cache:listings:*')."""
        try:
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
        except Exception:
            pass

    def is_duplicate(self, namespace: str, key: str, ttl: int = 86400) -> bool:
        """
        Idempotency check: returns True if this key was already processed.
        Sets the key with TTL on first call.
        """
        full_key = f"idempotent:{namespace}:{key}"
        try:
            result = self.client.set(full_key, "1", nx=True, ex=ttl)
            return result is None  # None = key already existed → duplicate
        except Exception:
            return False  # On Redis error, allow processing (fail open)

    def _sanitize_cache_kwargs(self, kwargs: dict) -> dict:
        """Filter out framework and un-serializable objects (db, request, response, etc.)"""
        ignored_keys = {"db", "session", "request", "response", "background_tasks", "current_user"}
        ignored_types = ("Session", "Request", "Response", "BackgroundTasks", "UploadFile", "WebSocket")
        clean = {}
        for k, v in kwargs.items():
            if k.lower() in ignored_keys:
                continue
            type_name = type(v).__name__
            if type_name in ignored_types or type_name.endswith("Session") or type_name.endswith("Request"):
                continue
            clean[k] = v
        return clean

    def cached(self, prefix: str, ttl: int = 60, should_cache=None):
        """Decorator that caches function return value in Redis.
        Supports both synchronous functions and async coroutines.

        `should_cache`, if given, is called with the function's result before
        writing to Redis. Returning False skips the write, so a one-off bad
        result (e.g. a relationship that failed to eager-load) self-heals on
        the next request instead of getting served from cache for the full ttl.
        """
        import inspect

        def decorator(func):
            is_async = inspect.iscoroutinefunction(func)

            if is_async:
                @wraps(func)
                async def async_wrapper(*args, **kwargs):
                    cache_kwargs = self._sanitize_cache_kwargs(kwargs)
                    key_hash = hashlib.md5(
                        json.dumps(cache_kwargs, sort_keys=True, default=str).encode()
                    ).hexdigest()
                    cache_key = f"cache:{prefix}:{key_hash}"

                    cached_value = self.get(cache_key)
                    if cached_value is not None:
                        return cached_value

                    result = await func(*args, **kwargs)
                    if should_cache is None or should_cache(result):
                        self.set(cache_key, result, ttl=ttl)
                    return result
                return async_wrapper
            else:
                @wraps(func)
                def sync_wrapper(*args, **kwargs):
                    cache_kwargs = self._sanitize_cache_kwargs(kwargs)
                    key_hash = hashlib.md5(
                        json.dumps(cache_kwargs, sort_keys=True, default=str).encode()
                    ).hexdigest()
                    cache_key = f"cache:{prefix}:{key_hash}"

                    cached_value = self.get(cache_key)
                    if cached_value is not None:
                        return cached_value

                    result = func(*args, **kwargs)
                    if should_cache is None or should_cache(result):
                        self.set(cache_key, result, ttl=ttl)
                    return result
                return sync_wrapper
        return decorator


cache = CacheService()
