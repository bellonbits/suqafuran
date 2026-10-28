"""
Unified SMS Adapter Pattern for Suqafuran backend.

Standardizes disparate SMS provider interfaces (Africa's Talking and Twilio)
under a single polymorphic SMSProvider protocol.
"""

from typing import Protocol, runtime_checkable, Optional, Dict, Any
import logging
from app.core.config import settings
from app.core.circuit_breaker import circuit_breakers

logger = logging.getLogger("sms_adapter")


@runtime_checkable
class SMSProvider(Protocol):
    """Unified protocol for SMS delivery adapters."""
    provider_name: str

    def is_configured(self) -> bool: ...

    def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        """
        Send SMS message.
        Returns:
            Dict containing standardized fields:
            {"status": "sent"|"error"|"circuit_open"|"disabled", "message_id": Optional[str], "provider": str}
        """
        ...


class AfricaTalkingSMSAdapter:
    """Adapts Africa's Talking SMS API to the unified SMSProvider protocol."""
    provider_name = "Africa's Talking"

    def __init__(self):
        from app.services.sms_service import sms_service
        self._service = sms_service
        self._circuit_breaker = circuit_breakers.get_or_create(
            "africastalking",
            failure_threshold=5,
            recovery_timeout=60.0
        )

    def is_configured(self) -> bool:
        return bool(settings.AFRICASTALKING_USERNAME and settings.AFRICASTALKING_API_KEY)

    def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        result = self._service.send_sms(to_number=to_number, message=message)
        result["provider"] = self.provider_name
        return result


class TwilioSMSAdapter:
    """Adapts Twilio Verify / SMS API to the unified SMSProvider protocol."""
    provider_name = "Twilio"

    def __init__(self):
        from app.services.twilio_service import twilio_service
        self._service = twilio_service
        self._circuit_breaker = circuit_breakers.get_or_create(
            "twilio",
            failure_threshold=5,
            recovery_timeout=60.0
        )

    def is_configured(self) -> bool:
        return bool(getattr(settings, "TWILIO_ACCOUNT_SID", None) and getattr(settings, "TWILIO_AUTH_TOKEN", None))

    def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {"status": "disabled", "message": "Twilio not configured", "provider": self.provider_name}

        if not self._circuit_breaker.is_available():
            remaining = self._circuit_breaker.time_until_retry()
            return {"status": "circuit_open", "message": f"Twilio circuit OPEN (retry in {remaining:.1f}s)", "provider": self.provider_name}

        try:
            success = self._circuit_breaker.call(self._service.send_verification_code, to_number)
            return {
                "status": "sent" if success else "failed",
                "message_id": None,
                "provider": self.provider_name
            }
        except Exception as e:
            return {"status": "error", "message": str(e), "provider": self.provider_name}


class SMSDispatcher:
    """Dispatches SMS using configured primary adapter, with automatic fallback."""
    def __init__(self):
        self.africastalking = AfricaTalkingSMSAdapter()
        self.twilio = TwilioSMSAdapter()

    def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        # Prefer Africa's Talking for East African coverage; fall back to Twilio
        providers = [self.africastalking, self.twilio]
        last_result = {"status": "disabled", "message": "No SMS providers configured"}

        for p in providers:
            if p.is_configured():
                res = p.send_sms(to_number, message)
                if res.get("status") == "sent":
                    return res
                last_result = res

        return last_result


sms_dispatcher = SMSDispatcher()
