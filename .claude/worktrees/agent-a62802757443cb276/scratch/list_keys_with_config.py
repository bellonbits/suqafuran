import sys
sys.path.append('/Users/mac/suqafuran/backend')
from app.core.config import settings
import redis

print(f"Connecting to REDIS_URL: {settings.REDIS_URL}")
try:
    r = redis.from_url(settings.REDIS_URL, decode_responses=True)
    keys = r.keys("*")
    print(f"Found {len(keys)} keys:")
    for key in keys:
        try:
            val = r.get(key)
            print(f"  {key} -> {val}")
        except Exception as e:
            print(f"  {key} (error reading value: {e})")
except Exception as e:
    print(f"Error: {e}")
