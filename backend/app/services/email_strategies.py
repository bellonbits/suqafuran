"""
Strategy Pattern for Email Delivery Providers in Suqafuran.

Implements interchangeable sending strategies (Brevo, Resend, SMTP)
governed by Circuit Breakers to prevent latency cascades during outages.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Protocol, Optional, Tuple, runtime_checkable
import logging
from app.core.config import settings
from app.core.circuit_breaker import circuit_breakers, CircuitBreakerOpenException

logger = logging.getLogger("email_strategies")


@runtime_checkable
class EmailStrategy(Protocol):
    """Protocol for interchangeable email delivery strategies."""
    provider_name: str

    def is_configured(self) -> bool:
        """Check if the required credentials/settings for this provider exist."""
        ...

    def send(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        unsub_url: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Execute email dispatch.
        Returns:
            Tuple[bool, str, Optional[str]]: (success, provider_name, failure_reason)
        """
        ...


class BrevoEmailStrategy:
    """Dispatches emails via Brevo (Sendinblue) v3 REST API."""
    provider_name = "Brevo"

    def __init__(self):
        self.circuit_breaker = circuit_breakers.get_or_create(
            "brevo",
            failure_threshold=3,
            recovery_timeout=60.0
        )

    def is_configured(self) -> bool:
        return bool(settings.BREVO_API_KEY)

    def send(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        unsub_url: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        if not self.is_configured():
            return False, self.provider_name, "Brevo API key not configured"

        # Check circuit breaker state first to fail fast without 15s timeout
        if not self.circuit_breaker.is_available():
            remaining = self.circuit_breaker.time_until_retry()
            logger.warning(f"[Brevo] Circuit is OPEN ({remaining:.1f}s cooldown). Fast failing to next strategy.")
            return False, self.provider_name, f"Brevo circuit OPEN (retry in {remaining:.1f}s)"

        def _execute_send():
            import requests
            brevo_payload = {
                "sender": {"name": settings.BREVO_FROM_NAME, "email": settings.BREVO_FROM_EMAIL},
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": html_content,
            }
            if unsub_url:
                brevo_payload["headers"] = {
                    "List-Unsubscribe": f"<{unsub_url}>, <mailto:support@suqafuran.com?subject=unsubscribe>",
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                }

            resp = requests.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json=brevo_payload,
                timeout=15,
            )
            resp.raise_for_status()
            return True

        try:
            self.circuit_breaker.call(_execute_send)
            logger.info(f"[Brevo] Email sent successfully to {to_email}")
            return True, self.provider_name, None
        except Exception as e:
            logger.error(f"[Brevo] Failed to send to {to_email}: {e}")
            return False, self.provider_name, str(e)


class ResendEmailStrategy:
    """Dispatches emails via Resend Python SDK."""
    provider_name = "Resend"

    def __init__(self):
        self.circuit_breaker = circuit_breakers.get_or_create(
            "resend",
            failure_threshold=5,
            recovery_timeout=60.0
        )

    def is_configured(self) -> bool:
        return bool(settings.RESEND_API_KEY)

    def send(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        unsub_url: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        if not self.is_configured():
            return False, self.provider_name, "Resend API key not configured"

        if not self.circuit_breaker.is_available():
            remaining = self.circuit_breaker.time_until_retry()
            logger.warning(f"[Resend] Circuit is OPEN ({remaining:.1f}s cooldown). Fast failing.")
            return False, self.provider_name, f"Resend circuit OPEN (retry in {remaining:.1f}s)"

        def _execute_send():
            import resend
            resend.api_key = settings.RESEND_API_KEY
            resend_payload = {
                "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            if unsub_url:
                resend_payload["headers"] = {
                    "List-Unsubscribe": f"<{unsub_url}>, <mailto:support@suqafuran.com?subject=unsubscribe>",
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                }
            resend.Emails.send(resend_payload)
            return True

        try:
            self.circuit_breaker.call(_execute_send)
            logger.info(f"[Resend] Email sent successfully to {to_email}")
            return True, self.provider_name, None
        except Exception as e:
            logger.error(f"[Resend] Failed to send to {to_email}: {e}")
            return False, self.provider_name, str(e)


class SmtpEmailStrategy:
    """Dispatches emails via synchronous SMTP fallback."""
    provider_name = "SMTP"

    def is_configured(self) -> bool:
        return bool(settings.SMTP_USER and settings.SMTP_PASSWORD and settings.SMTP_HOST)

    def send(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        unsub_url: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        if not self.is_configured():
            return False, self.provider_name, "SMTP credentials not configured"

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg["To"] = to_email
            if unsub_url:
                msg["List-Unsubscribe"] = f"<{unsub_url}>"

            msg.attach(MIMEText(html_content, "html", "utf-8"))

            if settings.SMTP_SSL:
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                if settings.SMTP_TLS:
                    server.starttls()

            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
            server.quit()
            logger.info(f"[SMTP] Email sent successfully to {to_email}")
            return True, self.provider_name, None
        except Exception as e:
            logger.error(f"[SMTP] Failed to send to {to_email}: {e}")
            return False, self.provider_name, str(e)


class EmailStrategyDispatcher:
    """
    Coordinates email strategy execution with automated circuit-breaker protected fallback.
    """
    def __init__(self):
        self.brevo = BrevoEmailStrategy()
        self.resend = ResendEmailStrategy()
        self.smtp = SmtpEmailStrategy()

    def dispatch(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        preferred_provider: str = "resend",
        unsub_url: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Attempts sending using the preferred provider, falling back seamlessly if
        the provider is unavailable, failed, or has an open circuit.
        """
        # Determine strategy order
        if preferred_provider == "brevo":
            strategies = [self.brevo, self.resend, self.smtp]
        else:
            strategies = [self.resend, self.brevo, self.smtp]

        errors = []
        for strategy in strategies:
            if not strategy.is_configured():
                continue

            success, provider, reason = strategy.send(to_email, subject, html_content, unsub_url)
            if success:
                return True, provider, None
            errors.append(f"{provider}: {reason}")

        all_errors = " | ".join(errors) if errors else "No email providers configured"
        return False, "None", all_errors


email_dispatcher = EmailStrategyDispatcher()
