"""Marketing email dispatcher with consent, suppression, and unsubscribe protections.

Enforces:
1. Active marketing consent checks against EmailPreference and NotificationPreferences.
2. Suppression-list checks against unsubscribed EmailLog records.
3. RFC 2369 / RFC 8058 standards-compliant List-Unsubscribe headers.
4. Token-based direct unsubscribe link generation.
5. Delivery logging to EmailLog.
"""

import logging
import secrets
from datetime import datetime
from typing import Any, Dict, Optional, Tuple
from sqlmodel import Session, select

from app.core.config import settings
from app.db.session import engine
from app.models.email_log import EmailLog
from app.models.marketing import EmailPreference
from app.models.notification_preferences import NotificationPreferences
from app.models.user import User

logger = logging.getLogger("marketing_emails")


def generate_tracking_token() -> str:
    """Generate a high-entropy URL-safe tracking and unsubscribe token."""
    return secrets.token_urlsafe(32)


def get_unsubscribe_url(token: str) -> str:
    """Return the absolute recipient-specific one-click unsubscribe endpoint URL."""
    base_url = settings.BACKEND_URL or "https://app.suqafuran.com"
    return f"{base_url}/api/v1/content/email/unsubscribe?token={token}"


def get_list_unsubscribe_headers(unsub_url: str) -> Dict[str, str]:
    """Generate RFC 2369 and RFC 8058 compliant List-Unsubscribe email headers."""
    return {
        "List-Unsubscribe": f"<{unsub_url}>, <mailto:unsubscribe@suqafuran.com?subject=unsubscribe>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }


def check_marketing_consent(
    db: Session,
    recipient: Any,
    campaign_type: str = "promotional_emails",
    user_id: Optional[int] = None
) -> Tuple[bool, str]:
    """Verify that a recipient has valid marketing consent and is not suppressed.
    
    recipient can be an email string or a User instance.
    Returns:
        (is_allowed: bool, reason_description: str)
    """
    user: Optional[User] = None
    if hasattr(recipient, "email"):
        user = recipient
        clean_email = (user.email or "").strip().lower()
    else:
        clean_email = str(recipient or "").strip().lower()

    if not clean_email or "@" not in clean_email:
        return False, "Invalid email address format"

    # Suppress internal dummy emails
    if clean_email.endswith("@suqafuran.local"):
        return False, "Suppressed internal dummy address (@suqafuran.local)"

    # Check suppression in EmailLog: if user clicked unsubscribe on any email
    unsubscribed_entry = db.exec(
        select(EmailLog.id).where(
            EmailLog.email == clean_email,
            EmailLog.status == "unsubscribed"
        ).limit(1)
    ).first()
    if unsubscribed_entry:
        return False, "Recipient is on the email suppression list (unsubscribed)"

    # Resolve User record
    user: Optional[User] = None
    if user_id:
        user = db.get(User, user_id)
    if not user:
        user = db.exec(select(User).where(User.email == clean_email)).first()

    if user and not user.is_active:
        return False, "User account is inactive or suspended"

    # If user exists in DB, inspect EmailPreference and NotificationPreferences
    if user:
        pref = db.exec(select(EmailPreference).where(EmailPreference.user_id == user.id)).first()
        if pref:
            # Campaign-specific preference gating
            if campaign_type in ["weekly_roundup", "weekly_digest", "retention_weekly_digest"]:
                if not pref.marketplace_digest:
                    return False, "User opted out of marketplace digests"
            elif campaign_type in ["seller_tips", "seller_growth_tips"]:
                if not pref.seller_tips:
                    return False, "User opted out of seller tips"
            elif campaign_type in ["seasonal_campaign"]:
                if not pref.seasonal_campaigns or not pref.promotional_emails:
                    return False, "User opted out of seasonal promotions"
            elif campaign_type in ["welcome", "onboarding_welcome"]:
                # Welcome emails are sent upon opt-in registration; allow unless promotional_emails is explicitly False
                if not pref.promotional_emails:
                    return False, "User opted out of promotional communications"
            else:
                # Default promotional check
                if not pref.promotional_emails:
                    return False, "User opted out of promotional emails"

        # Check NotificationPreferences
        notif_prefs = db.exec(
            select(NotificationPreferences).where(NotificationPreferences.user_id == user.id)
        ).first()
        if notif_prefs:
            if not notif_prefs.email_offers and campaign_type in ["product_discovery", "seasonal_campaign", "reengagement"]:
                return False, "User disabled email offers in notification settings"

    return True, "Eligible with valid consent"


def send_branded_marketing_email(
    email: str,
    campaign_key: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    user_id: Optional[int] = None,
    campaign_id: Optional[str] = None,
    tracking_token: Optional[str] = None,
    metadata: Optional[dict] = None
) -> Tuple[bool, str]:
    """Deliver a marketing email via EmailService with Brevo priority and List-Unsubscribe headers.
    
    Returns:
        (success: bool, status_message: str)
    """
    from app.services.email_service import email_service

    token = tracking_token or generate_tracking_token()
    unsub_url = get_unsubscribe_url(token)

    with Session(engine) as db:
        allowed, reason = check_marketing_consent(db, email, campaign_key, user_id=user_id)
        if not allowed:
            logger.info(f"[Marketing] Suppressed send to {email} for '{campaign_key}': {reason}")
            return False, reason

    # Outbound List-Unsubscribe headers for email client compliance (RFC 2369 / RFC 8058)
    headers = {
        "List-Unsubscribe": f"<{unsub_url}>, <mailto:support@suqafuran.com?subject=unsubscribe>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }

    meta = metadata or {}
    meta.update({
        "campaign_key": campaign_key,
        "is_marketing": True,
        "list_unsubscribe_url": unsub_url,
    })

    # Call EmailService._send_and_log with preferred_provider="brevo"
    success = email_service._send_and_log(
        email=email,
        subject=subject,
        html_body=html_content,
        email_type=f"marketing_{campaign_key}",
        user_id=user_id,
        campaign_id=campaign_id or f"mktg_{campaign_key}",
        metadata=meta,
        preferred_provider="brevo",
    )

    if success:
        return True, "Email successfully queued/sent"
    return False, "Delivery provider chain failed"
