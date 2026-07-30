"""SMS service for sending SMS notifications via Twilio."""

from typing import Optional
from twilio.rest import Client
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("sms_service")


class SMSService:
    """Service for sending SMS messages via Twilio."""

    def __init__(self):
        """Initialize Twilio client."""
        self.enabled = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)

        if self.enabled:
            self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            self.from_number = settings.TWILIO_PHONE_NUMBER
        else:
            self.client = None
            self.from_number = None
            logger.warning("SMS service not configured. Set TWILIO_* environment variables to enable.")

    def send_sms(
        self,
        to_number: str,
        message: str,
        campaign_id: Optional[int] = None
    ) -> dict:
        """
        Send SMS message to a phone number.

        Args:
            to_number: Recipient phone number (E.164 format recommended: +254...)
            message: SMS message content (max 160 chars per segment)
            campaign_id: Optional campaign ID for tracking

        Returns:
            Dict with status, SID, and other info
        """
        if not self.enabled:
            logger.warning(f"SMS service not enabled. Would send to {to_number}")
            return {"status": "disabled", "message": "SMS service not configured"}

        if not to_number:
            return {"status": "error", "message": "Phone number required"}

        if len(message) > 1600:
            return {"status": "error", "message": "Message too long (max 1600 chars)"}

        try:
            sms = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )

            logger.info(f"SMS sent to {to_number} (SID: {sms.sid})" + (f" Campaign: {campaign_id}" if campaign_id else ""))

            return {
                "status": "sent",
                "sid": sms.sid,
                "to": to_number,
                "campaign_id": campaign_id,
                "segments": (len(message) + 159) // 160  # SMS segments
            }

        except Exception as e:
            logger.error(f"Failed to send SMS to {to_number}: {e}")
            return {"status": "error", "message": str(e)}

    def send_bulk_sms(
        self,
        phone_numbers: list[str],
        message: str,
        campaign_id: Optional[int] = None
    ) -> dict:
        """
        Send SMS to multiple recipients.

        Args:
            phone_numbers: List of recipient phone numbers
            message: SMS message content
            campaign_id: Optional campaign ID for tracking

        Returns:
            Dict with success/failure counts
        """
        if not self.enabled:
            return {"status": "disabled", "message": "SMS service not configured"}

        if len(message) > 1600:
            return {"status": "error", "message": "Message too long"}

        success_count = 0
        failure_count = 0
        results = []

        for phone_number in phone_numbers:
            try:
                sms = self.client.messages.create(
                    body=message,
                    from_=self.from_number,
                    to=phone_number
                )
                success_count += 1
                results.append({"phone": phone_number, "status": "sent", "sid": sms.sid})

            except Exception as e:
                failure_count += 1
                logger.warning(f"Failed to send SMS to {phone_number}: {e}")
                results.append({"phone": phone_number, "status": "failed", "error": str(e)})

        logger.info(f"Bulk SMS: {success_count} sent, {failure_count} failed" + (f" Campaign: {campaign_id}" if campaign_id else ""))

        return {
            "status": "completed",
            "success": success_count,
            "failed": failure_count,
            "total": len(phone_numbers),
            "campaign_id": campaign_id,
            "results": results if failure_count > 0 else None  # Only return errors
        }

    def verify_phone_number(self, phone_number: str) -> bool:
        """
        Verify if a phone number is valid.

        Args:
            phone_number: Phone number to verify

        Returns:
            True if valid, False otherwise
        """
        if not phone_number or len(phone_number) < 10:
            return False

        # Basic validation: should contain only digits and + symbol
        import re
        return bool(re.match(r'^\+?[1-9]\d{1,14}$', phone_number))

    def format_phone_number(self, phone_number: str, country_code: str = "+254") -> str:
        """
        Format phone number to E.164 format.

        Args:
            phone_number: Phone number to format
            country_code: Country code (default: Kenya +254)

        Returns:
            Formatted phone number
        """
        # Remove non-numeric characters except +
        import re
        cleaned = re.sub(r'[^\d+]', '', phone_number)

        # Remove leading zeros after country code
        if cleaned.startswith('0') and len(cleaned) > 10:
            cleaned = cleaned[1:]

        # Add country code if missing
        if not cleaned.startswith('+'):
            if cleaned.startswith(country_code.replace('+', '')):
                cleaned = '+' + cleaned
            else:
                cleaned = country_code + cleaned

        return cleaned


# Initialize SMS service
sms_service = SMSService()
