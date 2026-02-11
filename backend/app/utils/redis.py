import redis
from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def set_verification_code(email: str, code: str, expire_hours: int = 24):
    redis_client.setex(f"verify:{email}", expire_hours * 3600, code)

def get_verification_code(email: str) -> str:
    return redis_client.get(f"verify:{email}")

def delete_verification_code(email: str):
    redis_client.delete(f"verify:{email}")

def set_reset_token(email: str, token: str, expire_hours: int = 1):
    redis_client.setex(f"reset:{email}", expire_hours * 3600, token)

def get_reset_token(email: str) -> str:
    return redis_client.get(f"reset:{email}")

def delete_reset_token(email: str):
    redis_client.delete(f"reset:{email}")
