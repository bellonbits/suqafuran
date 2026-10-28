import time
import unittest
from app.core.circuit_breaker import CircuitBreaker, CircuitState, CircuitBreakerOpenException


class TestCircuitBreaker(unittest.TestCase):
    def setUp(self):
        self.breaker = CircuitBreaker(
            name="test_service",
            failure_threshold=3,
            recovery_timeout=0.2,  # 200ms for fast test execution
            half_open_success_threshold=2
        )

    def test_initial_state_is_closed(self):
        self.assertEqual(self.breaker.state, CircuitState.CLOSED)
        self.assertTrue(self.breaker.is_available())

    def test_successful_call_passes_through(self):
        result = self.breaker.call(lambda x: x * 2, 5)
        self.assertEqual(result, 10)
        self.assertEqual(self.breaker.state, CircuitState.CLOSED)

    def test_failures_trip_to_open_after_threshold(self):
        def failing_call():
            raise ConnectionError("Service unreachable")

        for _ in range(2):
            with self.assertRaises(ConnectionError):
                self.breaker.call(failing_call)
            self.assertEqual(self.breaker.state, CircuitState.CLOSED)

        # 3rd failure trips the circuit
        with self.assertRaises(ConnectionError):
            self.breaker.call(failing_call)

        self.assertEqual(self.breaker.state, CircuitState.OPEN)
        self.assertFalse(self.breaker.is_available())

    def test_open_circuit_fails_fast_without_calling_function(self):
        self.breaker.trip()
        self.assertEqual(self.breaker.state, CircuitState.OPEN)

        called = False
        def dummy():
            nonlocal called
            called = True

        with self.assertRaises(CircuitBreakerOpenException) as ctx:
            self.breaker.call(dummy)

        self.assertFalse(called, "Function should NOT be called when circuit is OPEN")
        self.assertIn("is OPEN", str(ctx.exception))

    def test_half_open_recovery_transition(self):
        self.breaker.trip()
        self.assertEqual(self.breaker.state, CircuitState.OPEN)

        # Wait for recovery timeout (200ms)
        time.sleep(0.25)
        self.assertEqual(self.breaker.state, CircuitState.HALF_OPEN)
        self.assertTrue(self.breaker.is_available())

        # First successful test call keeps it in HALF_OPEN (threshold is 2)
        res1 = self.breaker.call(lambda: "ok1")
        self.assertEqual(res1, "ok1")
        self.assertEqual(self.breaker.state, CircuitState.HALF_OPEN)

        # Second successful test call transitions to CLOSED
        res2 = self.breaker.call(lambda: "ok2")
        self.assertEqual(res2, "ok2")
        self.assertEqual(self.breaker.state, CircuitState.CLOSED)

    def test_half_open_failure_immediately_retrips_to_open(self):
        self.breaker.trip()
        time.sleep(0.25)
        self.assertEqual(self.breaker.state, CircuitState.HALF_OPEN)

        with self.assertRaises(ValueError):
            self.breaker.call(lambda: (_ for _ in ()).throw(ValueError("probe failed")))

        self.assertEqual(self.breaker.state, CircuitState.OPEN)

    def test_decorator_usage(self):
        @self.breaker
        def add(a, b):
            return a + b

        self.assertEqual(add(3, 4), 7)


if __name__ == "__main__":
    unittest.main()
