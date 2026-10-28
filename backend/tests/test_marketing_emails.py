"""
Unit and Integration Tests for Suqafuran Marketing Email System

Tests cover:
1. Template rendering without error for all 7 marketing campaigns
2. Verification that required variables are supplied
3. Check for unresolved placeholders in rendered output
4. HTML escaping and XSS safety
5. Real product data formatting (KSh currency, listing URLs)
6. Graceful fallbacks for empty product collections
7. Plain-text alternative generation
8. Marketing consent, suppression list, and unsubscribe checks
9. Unsubscribe URL generation and RFC 2369 / RFC 8058 headers
10. Transactional email isolation (OTPs, reset codes unaffected)
11. Complete removal of obsolete templates from active registries
12. Admin preview generation and safe test email sending
"""

import unittest
from unittest.mock import MagicMock, patch

from app.services.marketing_emails.components import (
    BRAND_PRIMARY,
    BRAND_SECONDARY,
    BRAND_NAME,
    BRAND_LOGO_URL,
    sanitize,
    format_ksh,
    html_to_plain_text,
    render_email_shell,
    render_product_card,
    render_product_grid,
    render_category_chips,
    render_button,
    render_footer,
)
from app.services.marketing_emails.templates import (
    MARKETING_TEMPLATE_REGISTRY,
    render_welcome_template,
    render_product_discovery_template,
    render_weekly_roundup_template,
    render_seller_tips_template,
    render_category_discovery_template,
    render_seasonal_campaign_template,
    render_reengagement_template,
    render_marketing_template_preview,
)
from app.services.marketing_emails.sender import (
    check_marketing_consent,
    get_unsubscribe_url,
    get_list_unsubscribe_headers,
)
from app.services.email_service import email_service


class TestMarketingEmailComponents(unittest.TestCase):
    """Test reusable email design system components."""

    def test_brand_constants(self):
        self.assertEqual(BRAND_PRIMARY, "#00BFFF")
        self.assertEqual(BRAND_SECONDARY, "#0095D4")
        self.assertEqual(BRAND_NAME, "Suqafuran")
        self.assertTrue(BRAND_LOGO_URL.startswith("https://"))

    def test_sanitize_html(self):
        raw = '<script>alert("xss")</script> & "special" \'quotes\''
        safe = sanitize(raw)
        self.assertNotIn("<script>", safe)
        self.assertIn("&lt;script&gt;", safe)
        self.assertIn("&amp;", safe)
        self.assertIn("&quot;", safe)

    def test_format_ksh(self):
        self.assertEqual(format_ksh(1500), "KSh 1,500")
        self.assertEqual(format_ksh(250000.5), "KSh 250,000.50")
        self.assertEqual(format_ksh(250000), "KSh 250,000")
        self.assertEqual(format_ksh("invalid"), "KSh invalid")
        self.assertEqual(format_ksh(None), "KSh 0")

    def test_plain_text_converter(self):
        html = """
        <html>
            <body>
                <h1>Karibu Suqafuran</h1>
                <p>Find the best deals in Nairobi.</p>
                <a href="https://suqafuran.com/listings">Explore Listings</a>
            </body>
        </html>
        """
        plain = html_to_plain_text(html)
        self.assertIn("Karibu Suqafuran", plain)
        self.assertIn("Find the best deals in Nairobi", plain)
        self.assertIn("Explore Listings (https://suqafuran.com/listings)", plain)
        self.assertNotIn("<html>", plain)
        self.assertNotIn("<p>", plain)

    def test_email_shell_renders_table_layout(self):
        content = "<tr><td>Hello Suqafuran</td></tr>"
        shell = render_email_shell(
            content_html=content,
            title="Test Email",
            preview_text="Previewing this email",
            unsubscribe_url="https://suqafuran.com/unsubscribe?token=xyz",
        )
        self.assertIn("<!DOCTYPE html", shell)
        self.assertIn("Previewing this email", shell)
        self.assertIn("Hello Suqafuran", shell)
        self.assertIn("https://suqafuran.com/unsubscribe?token=xyz", shell)
        self.assertIn("#0095D4", shell)
        self.assertIn("Muthaiga Business Center", shell)


class TestMarketingTemplatesRendering(unittest.TestCase):
    """Test all 7 marketing email templates."""

    def setUp(self):
        self.sample_listings = [
            {
                "id": "1",
                "title": "Samsung Galaxy S22 Ultra 256GB",
                "price": 65000,
                "price_formatted": "KSh 65,000",
                "image_url": "https://res.cloudinary.com/suqafuran/image/upload/v1/s22.jpg",
                "location": "Nairobi CBD",
                "url": "https://suqafuran.com/listing/samsung-galaxy-s22",
                "category": "Electronics",
            },
            {
                "id": "2",
                "title": "Toyota Hilux Double Cab 2018",
                "price": 2850000,
                "price_formatted": "KSh 2,850,000",
                "image_url": "https://res.cloudinary.com/suqafuran/image/upload/v1/hilux.jpg",
                "location": "Mombasa",
                "url": "https://suqafuran.com/listing/toyota-hilux-2018",
                "category": "Vehicles",
            },
        ]
        self.sample_categories = [
            {"name": "Electronics", "slug": "electronics", "url": "https://suqafuran.com/category/electronics"},
            {"name": "Vehicles", "slug": "vehicles", "url": "https://suqafuran.com/category/vehicles"},
            {"name": "Fashion", "slug": "fashion", "url": "https://suqafuran.com/category/fashion"},
        ]

    def test_registry_contains_all_seven_templates(self):
        expected_templates = [
            "onboarding_welcome",
            "retention_recommendations",
            "retention_weekly_digest",
            "seller_growth_tips",
            "retention_category_interest",
            "seasonal_campaign",
            "retention_reengagement",
        ]
        for key in expected_templates:
            self.assertIn(key, MARKETING_TEMPLATE_REGISTRY)

    def test_obsolete_promotional_removed_from_registry(self):
        # The old hardcoded "promotional" (Flash Sale Frenzy) must NOT be present
        self.assertNotIn("promotional", MARKETING_TEMPLATE_REGISTRY)

    def test_email_1_welcome_template(self):
        rendered = render_welcome_template(
            recipient_name="Brian",
            categories=self.sample_categories,
            unsubscribe_url="https://suqafuran.com/unsubscribe?token=abc",
        )
        subject, html, text = rendered["subject"], rendered["html"], rendered["text"]
        self.assertIn("Karibu Suqafuran", subject)
        self.assertIn("Brian", html)
        self.assertIn("Electronics", html)
        self.assertIn("https://suqafuran.com/unsubscribe?token=abc", html)
        self.assertIn("Karibu Suqafuran", text)
        self.assertNotIn("{{", html)
        self.assertNotIn("}}", html)

    def test_email_2_product_discovery_template(self):
        rendered = render_product_discovery_template(
            recipient_name="Amina",
            listings=self.sample_listings,
            categories=self.sample_categories,
            unsubscribe_url="https://suqafuran.com/unsubscribe?token=abc",
        )
        subject, html, text = rendered["subject"], rendered["html"], rendered["text"]
        self.assertIn("Kuna kitu poa unatafuta?", subject)
        self.assertIn("Samsung Galaxy S22", html)
        self.assertIn("KSh 65,000", html)
        self.assertIn("Nairobi CBD", html)
        self.assertNotIn("{{", html)
        self.assertNotIn("}}", html)

    def test_email_2_product_discovery_fallback_when_empty_listings(self):
        rendered = render_product_discovery_template(
            recipient_name="Amina",
            listings=[],
            categories=self.sample_categories,
            unsubscribe_url="https://suqafuran.com/unsubscribe?token=abc",
        )
        subject, html = rendered["subject"], rendered["html"]
        self.assertIn("Kuna kitu poa unatafuta?", subject)
        # Should gracefully display category chips instead of broken listing cards
        self.assertIn("Browse Popular Categories", html)
        self.assertIn("Electronics", html)
        self.assertNotIn("{{", html)

    def test_email_3_weekly_roundup_template(self):
        rendered = render_weekly_roundup_template(
            recipient_name="Otieno",
            listings=self.sample_listings,
            categories=self.sample_categories,
            unsubscribe_url="https://suqafuran.com/unsubscribe?token=abc",
        )
        subject, html = rendered["subject"], rendered["html"]
        self.assertIn("marketplace roundup", subject.lower())
        self.assertIn("Toyota Hilux", html)
        self.assertIn("KSh 2,850,000", html)
        self.assertNotIn("{{", html)

    def test_email_4_seller_tips_template(self):
        rendered = render_seller_tips_template(
            recipient_name="Wanjiku",
            manage_listings_url="https://suqafuran.com/dashboard/listings",
            unsubscribe_url="https://suqafuran.com/unsubscribe?token=abc",
        )
        subject, html = rendered["subject"], rendered["html"]
        self.assertIn("Make your listings easier to discover", subject)
        self.assertIn("Clear, Descriptive Titles", html)
        self.assertIn("Clean, Bright Photos", html)
        self.assertIn("Fair, Competitive Pricing", html)
        self.assertIn("Manage your listings", html)
        self.assertNotIn("{{", html)

    def test_email_5_category_discovery_template(self):
        rendered = render_category_discovery_template(
            recipient_name="David",
            categories=self.sample_categories,
            unsubscribe_url="https://suqafuran.com/unsubscribe?token=abc",
        )
        subject, html = rendered["subject"], rendered["html"]
        self.assertIn("What are you looking for today?", subject)
        self.assertIn("Electronics", html)
        self.assertIn("Vehicles", html)
        self.assertIn("Fashion", html)
        self.assertNotIn("{{", html)

    def test_email_6_seasonal_campaign_template_with_verified_discount(self):
        rendered = render_seasonal_campaign_template(
            recipient_name="Brian",
            subject_line="Nairobi Tech Week",
            headline="Nairobi Tech Week Specials",
            body_text="Discover top smartphone and computing deals from verified local vendors.",
            cta_text="Shop Tech Week",
            cta_url="https://suqafuran.com/campaign/tech-week",
            campaign_dates="Valid Oct 24 - Oct 31",
            discount_badge="Up to 15% Off Select Verified Items",
            listings=self.sample_listings,
            unsubscribe_url="https://suqafuran.com/unsubscribe?token=abc",
        )
        subject, html = rendered["subject"], rendered["html"]
        self.assertIn("Nairobi Tech Week", subject)
        self.assertIn("Nairobi Tech Week Specials", html)
        self.assertIn("Up to 15% Off Select Verified Items", html)
        self.assertIn("Valid Oct 24 - Oct 31", html)
        self.assertIn("Samsung Galaxy S22", html)
        self.assertNotIn("{{", html)

    def test_email_6_seasonal_campaign_omits_unverified_discounts_safely(self):
        # When promo_discount and campaign_dates are None/empty, no fake claims should render
        rendered = render_seasonal_campaign_template(
            recipient_name="Brian",
            subject_line="Weekend Market",
            headline="Fresh Weekend Listings",
            body_text="Browse newly verified items across Nairobi and Mombasa.",
            cta_text="Explore Listings",
            cta_url="https://suqafuran.com/listings",
            campaign_dates=None,
            discount_badge=None,
            listings=[],
            unsubscribe_url="https://suqafuran.com/unsubscribe?token=abc",
        )
        subject, html = rendered["subject"], rendered["html"]
        self.assertIn("Weekend Market", subject)
        self.assertNotIn("SPECIAL OFFER", html)
        self.assertNotIn("Valid", html)
        self.assertNotIn("{{", html)

    def test_email_7_reengagement_template(self):
        rendered = render_reengagement_template(
            recipient_name="Fatma",
            listings=self.sample_listings,
            categories=self.sample_categories,
            unsubscribe_url="https://suqafuran.com/unsubscribe?token=abc",
        )
        subject, html = rendered["subject"], rendered["html"]
        self.assertIn("See what’s available on Suqafuran", subject)
        self.assertIn("Fatma", html)
        self.assertIn("Samsung Galaxy S22", html)
        self.assertNotIn("{{", html)

    def test_preview_renderer_desktop_and_mobile(self):
        for template_id in MARKETING_TEMPLATE_REGISTRY.keys():
            preview = render_marketing_template_preview(template_id=template_id)
            self.assertIn("subject", preview)
            self.assertIn("preview_text", preview)
            self.assertIn("html", preview)
            self.assertIn("plain_text", preview)
            self.assertIn("desktop_preview_url", preview)
            self.assertIn("mobile_preview_url", preview)
            self.assertIn("<!DOCTYPE html", preview["html"])
            self.assertGreater(len(preview["plain_text"]), 50)


class TestMarketingConsentAndUnsubscribe(unittest.TestCase):
    """Test consent verification, suppression checks, and unsubscribe mechanics."""

    def test_consent_denied_for_local_mock_emails(self):
        mock_db = MagicMock()
        mock_user = MagicMock()
        mock_user.email = "test@suqafuran.local"
        mock_user.is_active = True

        allowed, reason = check_marketing_consent(mock_db, mock_user, "promotional_emails")
        self.assertFalse(allowed, "Mock internal domain @suqafuran.local must never receive marketing sends")

    def test_consent_denied_for_inactive_users(self):
        mock_db = MagicMock()
        mock_user = MagicMock()
        mock_user.email = "customer@example.com"
        mock_user.is_active = False

        allowed, reason = check_marketing_consent(mock_db, mock_user, "promotional_emails")
        self.assertFalse(allowed, "Inactive users must be excluded from marketing sends")

    def test_consent_denied_when_suppressed_in_emaillog(self):
        mock_db = MagicMock()
        mock_user = MagicMock()
        mock_user.email = "unsubscribed@example.com"
        mock_user.is_active = True

        # Simulate EmailLog suppression query returning a match
        mock_log = MagicMock()
        mock_log.status = "unsubscribed"
        mock_db.exec.return_value.first.return_value = mock_log

        allowed, reason = check_marketing_consent(mock_db, mock_user, "promotional_emails")
        self.assertFalse(allowed, "Suppressed or unsubscribed email in EmailLog must be blocked")

    def test_unsubscribe_url_generation(self):
        url = get_unsubscribe_url("test_tracking_token_123")
        self.assertIn("/api/v1/content/email/unsubscribe?token=test_tracking_token_123", url)

    def test_list_unsubscribe_headers(self):
        headers = get_list_unsubscribe_headers("https://suqafuran.com/unsub?token=xyz")
        self.assertIn("List-Unsubscribe", headers)
        self.assertIn("List-Unsubscribe-Post", headers)
        self.assertEqual(headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click")
        self.assertIn("<https://suqafuran.com/unsub?token=xyz>", headers["List-Unsubscribe"])
        self.assertIn("<mailto:unsubscribe@suqafuran.com", headers["List-Unsubscribe"])


class TestTransactionalEmailsIntegrity(unittest.TestCase):
    """Ensure transactional emails remain unaffected and isolated."""

    @patch("app.core.config.settings.ENVIRONMENT", "development")
    @patch("app.services.otp_log_service.otp_log.record")
    @patch.object(email_service, "check_rate_limit", return_value=True)
    @patch("resend.Emails.send", return_value={"id": "resend_test_123"})
    def test_verification_code_transactional_send(self, mock_resend, mock_rate_limit, mock_otp_log):
        result = email_service.send_verification_code("user@example.com")
        self.assertTrue(result)
        mock_resend.assert_called_once()
        call_payload = mock_resend.call_args[0][0]
        self.assertEqual(call_payload["to"], ["user@example.com"])
        self.assertIn("Verification Code", call_payload["subject"])
        self.assertIn("Verify your account", call_payload["html"])

    @patch("resend.Emails.send", return_value={"id": "resend_test_123"})
    def test_password_reset_transactional_send(self, mock_resend):
        result = email_service.send_reset_code("user@example.com", "123456")
        self.assertTrue(result)
        mock_resend.assert_called_once()
        call_payload = mock_resend.call_args[0][0]
        self.assertEqual(call_payload["to"], ["user@example.com"])
        self.assertIn("Reset", call_payload["subject"])
        self.assertIn("123456", call_payload["html"])


if __name__ == "__main__":
    unittest.main()
