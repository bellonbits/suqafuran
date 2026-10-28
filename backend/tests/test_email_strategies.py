import unittest
from unittest.mock import patch, MagicMock
from app.core.circuit_breaker import CircuitBreaker, CircuitState, circuit_breakers
from app.services.email_strategies import (
    BrevoEmailStrategy,
    ResendEmailStrategy,
    SmtpEmailStrategy,
    EmailStrategyDispatcher,
)


class TestEmailStrategies(unittest.TestCase):
    def setUp(self):
        # Reset circuit breakers between tests
        cb_brevo = circuit_breakers.get_or_create("brevo")
        cb_brevo.reset()
        cb_resend = circuit_breakers.get_or_create("resend")
        cb_resend.reset()

    @patch("app.services.email_strategies.settings")
    def test_brevo_unconfigured(self, mock_settings):
        mock_settings.BREVO_API_KEY = None
        strategy = BrevoEmailStrategy()
        self.assertFalse(strategy.is_configured())
        success, provider, reason = strategy.send("test@example.com", "Subject", "<p>Hi</p>")
        self.assertFalse(success)
        self.assertEqual(provider, "Brevo")
        self.assertIn("not configured", reason)

    @patch("app.services.email_strategies.settings")
    def test_brevo_circuit_open_fast_fail(self, mock_settings):
        mock_settings.BREVO_API_KEY = "test_brevo_key"
        strategy = BrevoEmailStrategy()
        # Force breaker OPEN
        strategy.circuit_breaker.trip()
        self.assertEqual(strategy.circuit_breaker.state, CircuitState.OPEN)

        # Should fail fast without calling requests.post
        with patch("requests.post") as mock_post:
            success, provider, reason = strategy.send("test@example.com", "Subject", "<p>Hi</p>")
            self.assertFalse(success)
            self.assertIn("circuit OPEN", reason)
            mock_post.assert_not_called()

    @patch("app.services.email_strategies.settings")
    @patch("requests.post")
    def test_brevo_send_success(self, mock_post, mock_settings):
        mock_settings.BREVO_API_KEY = "test_key"
        mock_settings.BREVO_FROM_NAME = "Suqafuran"
        mock_settings.BREVO_FROM_EMAIL = "noreply@suqafuran.com"

        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        mock_post.return_value = mock_resp

        strategy = BrevoEmailStrategy()
        success, provider, reason = strategy.send("user@example.com", "Welcome", "<p>Welcome</p>")
        self.assertTrue(success)
        self.assertEqual(provider, "Brevo")
        self.assertIsNone(reason)
        mock_post.assert_called_once()

    @patch("app.services.email_strategies.settings")
    def test_resend_circuit_open_fast_fail(self, mock_settings):
        mock_settings.RESEND_API_KEY = "test_resend_key"
        strategy = ResendEmailStrategy()
        strategy.circuit_breaker.trip()

        success, provider, reason = strategy.send("test@example.com", "Subject", "<p>Hi</p>")
        self.assertFalse(success)
        self.assertIn("circuit OPEN", reason)

    @patch("app.services.email_strategies.settings")
    def test_smtp_unconfigured(self, mock_settings):
        mock_settings.SMTP_USER = None
        mock_settings.SMTP_PASSWORD = None
        mock_settings.SMTP_HOST = None

        strategy = SmtpEmailStrategy()
        self.assertFalse(strategy.is_configured())
        success, provider, reason = strategy.send("test@example.com", "Subject", "<p>Hi</p>")
        self.assertFalse(success)
        self.assertEqual(provider, "SMTP")
        self.assertIn("not configured", reason)

    def test_dispatcher_fallback_behavior(self):
        dispatcher = EmailStrategyDispatcher()

        # Mock resend to fail, brevo to succeed
        dispatcher.resend.is_configured = MagicMock(return_value=True)
        dispatcher.resend.send = MagicMock(return_value=(False, "Resend", "API Rate Limit"))

        dispatcher.brevo.is_configured = MagicMock(return_value=True)
        dispatcher.brevo.send = MagicMock(return_value=(True, "Brevo", None))

        dispatcher.smtp.is_configured = MagicMock(return_value=False)

        success, provider, err = dispatcher.dispatch(
            to_email="customer@example.com",
            subject="Order Placed",
            html_content="<p>Order #100</p>",
            preferred_provider="resend"
        )
        self.assertTrue(success)
        self.assertEqual(provider, "Brevo")
        self.assertIsNone(err)
        dispatcher.resend.send.assert_called_once()
        dispatcher.brevo.send.assert_called_once()

    def test_dispatcher_all_failed(self):
        dispatcher = EmailStrategyDispatcher()

        dispatcher.resend.is_configured = MagicMock(return_value=True)
        dispatcher.resend.send = MagicMock(return_value=(False, "Resend", "Resend down"))

        dispatcher.brevo.is_configured = MagicMock(return_value=True)
        dispatcher.brevo.send = MagicMock(return_value=(False, "Brevo", "Brevo down"))

        dispatcher.smtp.is_configured = MagicMock(return_value=False)

        success, provider, err = dispatcher.dispatch(
            to_email="customer@example.com",
            subject="Order Placed",
            html_content="<p>Order #100</p>",
            preferred_provider="resend"
        )
        self.assertFalse(success)
        self.assertEqual(provider, "None")
        self.assertIn("Resend: Resend down", err)
        self.assertIn("Brevo: Brevo down", err)


if __name__ == "__main__":
    unittest.main()
