from datetime import datetime, timedelta
from typing import Any, Union, Optional, List, Dict
from jose import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Request
from app.core.config import settings
from app.models.user import User, TrustLevel
import redis

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = settings.JWT_ALGORITHM

# Redis connection for custom rate limiting
# In production, use the URL from settings
try:
    from app.utils.redis import from_url_safe
    redis_client = from_url_safe(settings.REDIS_URL, decode_responses=True)
except Exception:
    # Fallback for local dev if URL is not set
    redis_client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=settings.REDIS_DB, decode_responses=True)

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

class RiskBasedSecurity:
    @staticmethod
    def check_listing_limit(user: User):
        """
        Enforce different listing limits based on trust level.
        """
        key = f"limit:listings:{user.id}"
        try:
            count = redis_client.get(key) or 0
            count = int(count)
            
            # Define limits
            limits = {
                TrustLevel.NEW: 5,        # 5 per day
                TrustLevel.ESTABLISHED: 20,
                TrustLevel.VERIFIED: 100,
                TrustLevel.TRUSTED: 1000
            }
            
            if count >= limits.get(user.trust_level, 5):
                raise HTTPException(status_code=429, detail="Daily listing limit reached for your trust level. Complete verification to increase limits.")
            
            # Increment and set TTL if new
            redis_client.incr(key)
            if count == 0:
                redis_client.expire(key, 86400) # 24 hours
        except redis.RedisError:
            # Fallback if redis is down
            pass

    @staticmethod
    def check_messaging_limit(user: User):
        """
        Prevent spam by limiting message frequency.
        """
        key = f"limit:messages:{user.id}"
        try:
            count = redis_client.get(key) or 0
            count = int(count)
            
            # New/Low Trust users are heavily limited
            if user.trust_score < 100 and count >= 10:
                 raise HTTPException(status_code=429, detail="Message limit reached. Please wait before sending more messages.")
            
            redis_client.incr(key)
            if count == 0:
                redis_client.expire(key, 3600) # 1 hour limit
        except redis.RedisError:
            pass

risk_security = RiskBasedSecurity()
