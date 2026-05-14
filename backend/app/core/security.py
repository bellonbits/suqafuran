from fastapi import HTTPException, Request
from app.models.user import User, TrustLevel
from app.core.limiter import limiter
import redis

# Redis connection for custom rate limiting
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

class RiskBasedSecurity:
    @staticmethod
    def check_listing_limit(user: User):
        """
        Enforce different listing limits based on trust level.
        """
        key = f"limit:listings:{user.id}"
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

    @staticmethod
    def check_messaging_limit(user: User):
        """
        Prevent spam by limiting message frequency.
        """
        key = f"limit:messages:{user.id}"
        count = redis_client.get(key) or 0
        count = int(count)
        
        # New/Low Trust users are heavily limited
        if user.trust_score < 100 and count >= 10:
             raise HTTPException(status_code=429, detail="Message limit reached. Please wait before sending more messages.")
        
        redis_client.incr(key)
        if count == 0:
            redis_client.expire(key, 3600) # 1 hour limit

risk_security = RiskBasedSecurity()
