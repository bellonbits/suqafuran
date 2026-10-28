import unittest
from unittest.mock import patch, MagicMock
from app.core.circuit_breaker import circuit_breakers
from app.services.sms_adapter import (
    AfricaTalkingSMSAdapter,
    TwilioSMSAdapter,
    SMSDispatcher,
)


class TestSMSAdapter(unittest.TestCase):
    def setUp(self):
        cb_at = circuit_breakers.get_or_create("africastalking")
        cb_at.reset()
        cb_tw = circuit_breakers.get_or_create("twilio")
        cb_tw.reset()

    @patch("app.services.sms_adapter.settings")
    def test_africastalking_configuration(self, mock_settings):
        mock_settings.AFRICASTALKING_USERNAME = "user"
        mock_settings.AFRICASTALKING_API_KEY = "key"
        adapter = AfricaTalkingSMSAdapter()
        self.assertTrue(adapter.is_configured())

        mock_settings.AFRICASTALKING_USERNAME = None
        self.assertFalse(adapter.is_configured())

    @patch("app.services.sms_adapter.settings")
    def test_twilio_circuit_open_fast_fail(self, mock_settings):
        mock_settings.TWILIO_ACCOUNT_SID = "AC123"
        mock_settings.TWILIO_AUTH_TOKEN = "token123"

        adapter = TwilioSMSAdapter()
        adapter._circuit_breaker.trip()

        res = adapter.send_sms("+252615000000", "OTP: 1234")
        self.assertEqual(res["status"], "circuit_open")
        self.assertEqual(res["provider"], "Twilio")
        self.assertIn("circuit OPEN", res["message"])

    def test_dispatcher_fallback_to_twilio(self):
        dispatcher = SMSDispatcher()

        dispatcher.africastalking.is_configured = MagicMock(return_value=True)
        dispatcher.africastalking.send_sms = MagicMock(
            return_value={"status": "error", "message": "Gateway timeout", "provider": "Africa's Talking"}
        )

        dispatcher.twilio.is_configured = MagicMock(return_value=True)
        dispatcher.twilio.send_sms = MagicMock(
            return_value={"status": "sent", "message_id": "SM123", "provider": "Twilio"}
        )

        result = dispatcher.send_sms("+252615000000", "Hello from Suqafuran")
        self.assertEqual(result["status"], "sent")
        self.assertEqual(result["provider"], "Twilio")
        dispatcher.africastalking.send_sms.assert_called_once()
        dispatcher.twilio.send_sms.assert_called_once()

    def test_dispatcher_no_providers_configured(self):
        dispatcher = SMSDispatcher()
        dispatcher.africastalking.is_configured = MagicMock(return_value=False)
        dispatcher.twilio.is_configured = MagicMock(return_value=False)

        result = dispatcher.send_sms("+252615000000", "Hello")
        self.assertEqual(result["status"], "disabled")
        self.assertIn("No SMS providers configured", result["message"])


if __name__ == "__main__":
    unittest.main()
