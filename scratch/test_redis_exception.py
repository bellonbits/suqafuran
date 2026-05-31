import redis

r = redis.Redis(host='localhost', port=6379, password='suqaredis', db=0)
try:
    r.ping()
except Exception as e:
    print(f"Exception class: {e.__class__}")
    print(f"Exception MRO: {e.__class__.__mro__}")
    print(f"Exception message: {e}")
