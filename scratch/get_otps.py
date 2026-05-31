import redis
from dotenv import load_dotenv
import os

load_dotenv('/Users/mac/suqafuran/backend/.env')

host = os.getenv('REDIS_HOST', 'localhost')
port = int(os.getenv('REDIS_PORT', 6379))
db = int(os.getenv('REDIS_DB', 0))

print(f"Connecting to Redis (no password) at {host}:{port} db={db}...")
try:
    r = redis.Redis(host=host, port=port, db=db, decode_responses=True)
    keys = r.keys("otp:*")
    print(f"Found {len(keys)} OTP keys in Redis:")
    for key in keys:
        val = r.get(key)
        print(f"  {key} -> {val}")
except Exception as e:
    print(f"Error: {e}")
