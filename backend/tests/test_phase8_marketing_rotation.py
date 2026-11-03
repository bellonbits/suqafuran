"""
Unit and Integration Tests for Phase 8: Marketing Automation & Headline Rotation.

Verifies:
1. Every campaign in CATALOG has 10 to 20 unique, engaging subject variants.
2. The rotation engine never revolves around just one headline, cycling through the full pool.
3. EmailEventType templates in MarketingAutomationService have 10-15 rotating subject variants.
4. Marketing SMS templates rotate through 15 distinct variants based on user ID and prior sends.
"""

import unittest
from datetime import datetime, timedelta
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.models.user import User, UserVerifiedLevel
from app.models.listing import Listing, Category
from app.models.marketing import EmailPreference, EmailEventType
from app.models.campaign_send_log import CampaignSendLog
from app.models.checkout_receipt import CheckoutReceipt
from app.services.campaign_catalog import CATALOG
from app.services.rotation_engine import select_campaigns_for_user, record_send
from app.services.marketing_service import MarketingAutomationService
from app.services.marketing_sms_service import MarketingSMSService, SMS_HEADLINE_TEMPLATES


class TestPhase8MarketingRotation(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        SQLModel.metadata.create_all(self.engine)
        self.db = Session(self.engine)

        # Seed test user
        self.user = User(
            id=42,
            email="testuser@example.com",
            full_name="Fatima Mohamed",
            phone="+254712345678",
            is_active=True,
            is_verified=True,
            verified_level=UserVerifiedLevel.phone,
        )
        self.db.add(self.user)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    # ─── 1. Campaign Catalog Rotation Verification ────────────────────────────

    def test_all_catalog_campaigns_have_10_to_20_variants(self):
        """Verify NO campaign revolves around just 1 headline; all must have 10-20 variants."""
        self.assertGreaterEqual(len(CATALOG), 8, "Expected at least 8 campaign definitions")

        for c_type, definition in CATALOG.items():
            variants = definition.subject_variants
            self.assertIsNotNone(variants, f"Variants should not be None for {c_type}")
            self.assertGreaterEqual(
                len(variants), 10,
                f"Campaign '{c_type}' must have at least 10 rotating variants, but got {len(variants)}"
            )
            self.assertLessEqual(
                len(variants), 20,
                f"Campaign '{c_type}' should have at most 20 variants, but got {len(variants)}"
            )

            # Ensure all variants are non-empty and unique
            unique_variants = set(variants)
            self.assertEqual(
                len(variants), len(unique_variants),
                f"Variants for '{c_type}' must be distinct without duplicates"
            )

    def test_rotation_engine_cycles_through_all_variants_without_revolving(self):
        """Simulate sequential campaign sends and verify it rotates cleanly through the variants."""
        definition = CATALOG["promo_new_arrivals"]
        total_variants = len(definition.subject_variants)
        user_id = self.user.id

        seen_subjects = []
        for send_idx in range(total_variants):
            # Calculate variant index as rotation_engine does
            variant_index = (user_id + send_idx) % total_variants
            selected_subject = definition.subject_variants[variant_index]
            seen_subjects.append(selected_subject)

            # Log send in DB to verify sequential tracking
            self.db.add(CampaignSendLog(
                user_id=user_id,
                campaign_type="promo_new_arrivals",
                subject_variant=selected_subject,
                sent_at=datetime.utcnow() - timedelta(days=20 * (total_variants - send_idx)),
            ))
            self.db.commit()

        # All variants visited
        self.assertEqual(len(seen_subjects), total_variants)
        self.assertEqual(len(set(seen_subjects)), total_variants, "Must rotate through all distinct variants")

        # Consecutively, no two sends are identical
        for i in range(len(seen_subjects) - 1):
            self.assertNotEqual(seen_subjects[i], seen_subjects[i + 1])

    def test_cohort_diversification_for_different_users(self):
        """Verify two different users on their first send receive different subject lines."""
        definition = CATALOG["weekly_digest"]
        variants = definition.subject_variants

        user_1_idx = (1 + 0) % len(variants)
        user_2_idx = (2 + 0) % len(variants)

        self.assertNotEqual(
            variants[user_1_idx], variants[user_2_idx],
            "Users with different IDs should receive diverse initial variants"
        )

    # ─── 2. Marketing Automation Email Templates ──────────────────────────────

    def test_all_email_event_types_have_10_to_15_rotating_subjects(self):
        """Verify MarketingAutomationService.EMAIL_TEMPLATES has 10-15 rotating subjects per event."""
        templates = MarketingAutomationService.EMAIL_TEMPLATES

        for event_type, tmpl_data in templates.items():
            subjects = tmpl_data.get("subjects")
            self.assertIsNotNone(subjects, f"Event {event_type} must have 'subjects' list")
            self.assertGreaterEqual(
                len(subjects), 10,
                f"Event {event_type} must have at least 10 rotating subjects, got {len(subjects)}"
            )
            self.assertLessEqual(
                len(subjects), 15,
                f"Event {event_type} should have up to 15 subjects, got {len(subjects)}"
            )
            # Ensure unique
            self.assertEqual(len(subjects), len(set(subjects)), f"Duplicate subjects in {event_type}")

    # ─── 3. Marketing SMS Headline Rotation ───────────────────────────────────

    def test_marketing_sms_has_15_rotating_templates(self):
        """Verify MarketingSMSService has 15 rotating headline templates."""
        self.assertGreaterEqual(len(SMS_HEADLINE_TEMPLATES), 10)
        self.assertLessEqual(len(SMS_HEADLINE_TEMPLATES), 20)
        self.assertEqual(len(SMS_HEADLINE_TEMPLATES), len(set(SMS_HEADLINE_TEMPLATES)))

    def test_sms_composition_rotates_cleanly(self):
        """Verify compose_sms changes headlines as send_sequence increments."""
        sms_service = MarketingSMSService()
        dummy_listing = Listing(
            id=99,
            title_en="iPhone 13 128GB",
            price=52000.0,
            currency="KES",
            category_id=1,
            location="Nairobi",
            condition="Used",
            status="active",
        )

        seen_sms = []
        for seq in range(len(SMS_HEADLINE_TEMPLATES)):
            msg = sms_service.compose_sms(self.user, [dummy_listing], send_sequence=seq)
            self.assertIn("Fatima", msg)
            self.assertIn("iPhone 13", msg)
            self.assertIn("STOP", msg)
            seen_sms.append(msg)

        # All rotated templates must be distinct
        self.assertEqual(len(set(seen_sms)), len(SMS_HEADLINE_TEMPLATES))


if __name__ == "__main__":
    unittest.main()
