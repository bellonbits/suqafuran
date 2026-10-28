"""
Circuit Breaker Pattern implementation for external service resilience in Suqafuran.

Protects against cascading failures when external providers (Africa's Talking,
Brevo, Resend, Cloudinary, Groq, Safaricom M-Pesa) experience downtime or latency spikes.

States:
- CLOSED: Normal operation. Requests pass through. Failures are counted.
- OPEN: Failure threshold exceeded. Requests fail fast without hitting the remote provider.
- HALF_OPEN: Recovery timeout elapsed. Trial requests test if provider has recovered.
"""

import time
import threading
import logging
from enum import Enum
from functools import wraps
from typing import Callable, Any, Optional, Type, Tuple

logger = logging.getLogger("circuit_breaker")


class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreakerOpenException(Exception):
    """Raised when an operation is attempted while the circuit breaker is OPEN."""
    def __init__(self, name: str, retry_after: float):
        self.name = name
        self.retry_after = retry_after
        super().__init__(
            f"Circuit breaker '{name}' is OPEN. Remote service is temporarily unavailable. "
            f"Retry after {retry_after:.1f}s."
        )


class CircuitBreaker:
    """
    Thread-safe Circuit Breaker state machine.
    """
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        half_open_success_threshold: int = 2,
        expected_exceptions: Tuple[Type[Exception], ...] = (Exception,)
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_success_threshold = half_open_success_threshold
        self.expected_exceptions = expected_exceptions

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = 0.0
        self._last_state_change = time.time()
        self._lock = threading.Lock()

    @property
    def state(self) -> CircuitState:
        with self._lock:
            self._evaluate_state_transition()
            return self._state

    def _evaluate_state_transition(self):
        """Transition from OPEN to HALF_OPEN if recovery timeout has elapsed."""
        if self._state == CircuitState.OPEN:
            elapsed = time.time() - self._last_failure_time
            if elapsed >= self.recovery_timeout:
                self._state = CircuitState.HALF_OPEN
                self._success_count = 0
                self._last_state_change = time.time()
                logger.info(
                    f"CircuitBreaker[{self.name}]: Recovery timeout elapsed ({elapsed:.1f}s >= {self.recovery_timeout}s). "
                    f"Transitioned to HALF_OPEN."
                )

    def is_available(self) -> bool:
        """Checks if calls are allowed through without raising an exception."""
        with self._lock:
            self._evaluate_state_transition()
            return self._state != CircuitState.OPEN

    def time_until_retry(self) -> float:
        """Returns seconds until circuit can be retried if OPEN, or 0.0 otherwise."""
        with self._lock:
            if self._state != CircuitState.OPEN:
                return 0.0
            elapsed = time.time() - self._last_failure_time
            remaining = self.recovery_timeout - elapsed
            return max(0.0, remaining)

    def record_success(self):
        """Record successful execution."""
        with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.half_open_success_threshold:
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
                    self._success_count = 0
                    self._last_state_change = time.time()
                    logger.info(
                        f"CircuitBreaker[{self.name}]: Success threshold reached ({self._success_count}). "
                        f"Transitioned to CLOSED."
                    )
            elif self._state == CircuitState.CLOSED:
                self._failure_count = 0

    def record_failure(self, error: Exception):
        """Record failed execution and update circuit state."""
        with self._lock:
            self._failure_count += 1
            self._last_failure_time = time.time()

            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                self._last_state_change = time.time()
                logger.warning(
                    f"CircuitBreaker[{self.name}]: Call failed during HALF_OPEN ({error}). "
                    f"Re-tripped to OPEN. Cooldown {self.recovery_timeout}s."
                )
            elif self._state == CircuitState.CLOSED:
                if self._failure_count >= self.failure_threshold:
                    self._state = CircuitState.OPEN
                    self._last_state_change = time.time()
                    logger.error(
                        f"CircuitBreaker[{self.name}]: Failure threshold ({self.failure_threshold}) exceeded. "
                        f"Tripped to OPEN. Cooldown {self.recovery_timeout}s. Last error: {error}"
                    )

    def reset(self):
        """Manually reset the circuit breaker to CLOSED."""
        with self._lock:
            self._state = CircuitState.CLOSED
            self._failure_count = 0
            self._success_count = 0
            self._last_state_change = time.time()
            logger.info(f"CircuitBreaker[{self.name}]: Manually reset to CLOSED.")

    def trip(self):
        """Manually trip the circuit breaker to OPEN."""
        with self._lock:
            self._state = CircuitState.OPEN
            self._last_failure_time = time.time()
            self._last_state_change = time.time()
            logger.warning(f"CircuitBreaker[{self.name}]: Manually tripped to OPEN.")

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute callable through the circuit breaker.
        Raises CircuitBreakerOpenException if the circuit is OPEN.
        """
        with self._lock:
            self._evaluate_state_transition()
            if self._state == CircuitState.OPEN:
                remaining = self.recovery_timeout - (time.time() - self._last_failure_time)
                raise CircuitBreakerOpenException(self.name, max(0.0, remaining))

        try:
            result = func(*args, **kwargs)
            self.record_success()
            return result
        except self.expected_exceptions as e:
            self.record_failure(e)
            raise e

    def __call__(self, func: Callable) -> Callable:
        """Decorator support."""
        @wraps(func)
        def wrapper(*args, **kwargs):
            return self.call(func, *args, **kwargs)
        return wrapper


class CircuitBreakerRegistry:
    """Registry managing all active circuit breakers across the application."""
    def __init__(self):
        self._breakers = {}
        self._lock = threading.Lock()

    def get_or_create(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        half_open_success_threshold: int = 2
    ) -> CircuitBreaker:
        with self._lock:
            if name not in self._breakers:
                self._breakers[name] = CircuitBreaker(
                    name=name,
                    failure_threshold=failure_threshold,
                    recovery_timeout=recovery_timeout,
                    half_open_success_threshold=half_open_success_threshold
                )
            return self._breakers[name]

    def get_all_statuses(self) -> dict:
        with self._lock:
            return {
                name: {
                    "state": cb.state.value,
                    "failure_count": cb._failure_count,
                    "retry_after_seconds": round(cb.time_until_retry(), 1)
                }
                for name, cb in self._breakers.items()
            }


circuit_breakers = CircuitBreakerRegistry()
