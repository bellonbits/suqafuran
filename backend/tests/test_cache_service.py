import asyncio
import unittest
from unittest.mock import MagicMock
from app.services.cache_service import CacheService


class DummyRequest:
    pass


class DummySession:
    pass


class TestCacheService(unittest.TestCase):
    def setUp(self):
        self.cache_service = CacheService()
        self.mock_store = {}

        # Mock Redis get and set to in-memory dict
        self.cache_service.get = lambda k: self.mock_store.get(k)
        self.cache_service.set = lambda k, v, ttl=60: self.mock_store.__setitem__(k, v)

    def test_sanitize_cache_kwargs(self):
        req = DummyRequest()
        sess = DummySession()
        kwargs = {
            "category_id": 5,
            "search": "toyota",
            "db": sess,
            "request": req,
            "current_user": {"id": 1}
        }
        cleaned = self.cache_service._sanitize_cache_kwargs(kwargs)
        self.assertIn("category_id", cleaned)
        self.assertIn("search", cleaned)
        self.assertNotIn("db", cleaned)
        self.assertNotIn("request", cleaned)
        self.assertNotIn("current_user", cleaned)

    def test_sync_function_caching(self):
        call_count = 0

        @self.cache_service.cached(prefix="test_sync", ttl=60)
        def compute_sum(a, b, db=None):
            nonlocal call_count
            call_count += 1
            return a + b

        sess = DummySession()
        res1 = compute_sum(10, 20, db=sess)
        self.assertEqual(res1, 30)
        self.assertEqual(call_count, 1)

        # Second call should hit cache and NOT invoke compute_sum
        res2 = compute_sum(10, 20, db=sess)
        self.assertEqual(res2, 30)
        self.assertEqual(call_count, 1)

    def test_async_function_caching(self):
        call_count = 0

        @self.cache_service.cached(prefix="test_async", ttl=60)
        async def fetch_data(item_id, request=None):
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.01)
            return {"id": item_id, "title": f"Item {item_id}"}

        async def run_async_test():
            req = DummyRequest()
            r1 = await fetch_data(42, request=req)
            self.assertEqual(r1["title"], "Item 42")
            self.assertEqual(call_count, 1)

            # Second call should be served from cache
            r2 = await fetch_data(42, request=req)
            self.assertEqual(r2["title"], "Item 42")
            self.assertEqual(call_count, 1)

        asyncio.run(run_async_test())

    def test_should_cache_guard(self):
        call_count = 0

        @self.cache_service.cached(prefix="guarded", ttl=60, should_cache=lambda res: res.get("valid", False))
        def get_item(valid: bool):
            nonlocal call_count
            call_count += 1
            return {"valid": valid, "data": "abc"}

        # Call with valid=False -> should NOT be cached
        r1 = get_item(False)
        self.assertFalse(r1["valid"])
        self.assertEqual(call_count, 1)

        r2 = get_item(False)
        self.assertEqual(call_count, 2, "Should re-invoke since previous result was rejected by should_cache")


if __name__ == "__main__":
    unittest.main()
