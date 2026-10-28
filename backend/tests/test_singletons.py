import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch
from app.services.kafka_admin import get_kafka_admin, KafkaAdminClient
import app.services.kafka_admin as ka_module
from app.services.jaeger_client import get_jaeger_client
from app.services.event_stream import get_event_stream_manager


class TestThreadSafeSingletons(unittest.TestCase):
    @patch.object(KafkaAdminClient, "_initialize", return_value=None)
    def test_kafka_admin_singleton_thread_safety(self, mock_init):
        # Reset singleton to test clean concurrent init
        ka_module._kafka_admin = None

        def _fetch_kafka_admin():
            return get_kafka_admin()

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(_fetch_kafka_admin) for _ in range(50)]
            results = [f.result() for f in futures]

        first_instance = results[0]
        self.assertIsNotNone(first_instance)
        for inst in results[1:]:
            self.assertIs(inst, first_instance)

    def test_jaeger_client_singleton_thread_safety(self):
        def _fetch_jaeger():
            return get_jaeger_client()

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(_fetch_jaeger) for _ in range(50)]
            results = [f.result() for f in futures]

        first_instance = results[0]
        self.assertIsNotNone(first_instance)
        for inst in results[1:]:
            self.assertIs(inst, first_instance)

    def test_event_stream_singleton_thread_safety(self):
        def _fetch_event_stream():
            return get_event_stream_manager()

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(_fetch_event_stream) for _ in range(50)]
            results = [f.result() for f in futures]

        first_instance = results[0]
        self.assertIsNotNone(first_instance)
        for inst in results[1:]:
            self.assertIs(inst, first_instance)


if __name__ == "__main__":
    unittest.main()
