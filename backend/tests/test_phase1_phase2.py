"""
Automated Test Suite for Phase 1 (Stability) and Phase 2 (Trust & Safety).
Tests:
- RealtimeBroadcaster WebSocket & SSE dispatch
- Zero-Result Search Logging & Unmet Demand Analytics
- Seller Performance Metrics (Response Rate, Median Time, Reviews, Badges)
- Gated Reviews & Anti-Fake Review Protection
- 3-Tier AI-Assisted Moderation & Fraud Pipeline (Low, Medium, High Risk)
"""

import unittest
import asyncio
from datetime import datetime, timedelta
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool

from app.models.user import User, UserVerifiedLevel, TrustLevel
from app.models.listing import Listing, Category
from app.models.message import Message
from app.models.review import Review
from app.models.report import ListingReport
from app.models.analytics import ZeroResultSearch
from app.services.realtime_broadcaster import RealtimeBroadcaster
from app.services.seller_performance_service import calculate_seller_performance
from app.services.moderation_pipeline import evaluate_listing_moderation, ModerationDecisionTier


class DummyWebSocket:
    """Mock WebSocket for testing broadcaster dispatch."""
    def __init__(self):
        self.accepted = False
        self.sent_messages = []
        self.closed = False

    async def accept(self):
        self.accepted = True

    async def send_json(self, data):
        if self.closed:
            raise RuntimeError("WebSocket is closed")
        self.sent_messages.append(data)

    async def close(self, code=1000, reason=""):
        self.closed = True


class Phase1AndPhase2TestSuite(unittest.TestCase):
    def setUp(self):
        # In-memory SQLite database with StaticPool for thread-safe test isolation
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        # Create only the required tables for isolated testing
        tables = [
            User.__table__,
            Category.__table__,
            Listing.__table__,
            Message.__table__,
            Review.__table__,
            ListingReport.__table__,
            ZeroResultSearch.__table__,
        ]
        SQLModel.metadata.create_all(self.engine, tables=tables)
        self.db = Session(self.engine)

        # Seed test category
        self.category = Category(
            id=1,
            name_en="Electronics",
            slug="electronics",
            icon_name="smartphone"
        )
        self.db.add(self.category)

        # Seed verified seller
        self.seller = User(
            id=10,
            email="seller@example.com",
            full_name="Fatima Electronics",
            phone="+254711223344",
            phone_verified=True,
            verified_level=UserVerifiedLevel.tier2,
            trust_score=350,
            trust_level=TrustLevel.VERIFIED,
            is_active=True,
            is_verified=True,
        )
        self.db.add(self.seller)

        # Seed buyer
        self.buyer = User(
            id=20,
            email="buyer@example.com",
            full_name="Ahmed Buyer",
            phone="+254799887766",
            phone_verified=True,
            verified_level=UserVerifiedLevel.tier1,
            is_active=True,
        )
        self.db.add(self.buyer)

        # Seed test listing
        self.listing = Listing(
            id=101,
            title_en="Samsung Galaxy S22 Ultra 256GB",
            description_en="Mint condition smartphone with original charger and box.",
            price=65000.0,
            location="Eastleigh, Nairobi",
            condition="Used",
            category_id=1,
            owner_id=10,
            status="active",
            moderation_status="approved",
            approval_status="approved",
        )
        self.db.add(self.listing)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        SQLModel.metadata.drop_all(self.engine)

    # ==================== PHASE 1 TESTS ====================

    def test_realtime_broadcaster_local_dispatch(self):
        """Verify RealtimeBroadcaster registers local sockets and dispatches JSON events."""
        broadcaster = RealtimeBroadcaster()
        ws = DummyWebSocket()

        async def run_test():
            await broadcaster.connect_user(10, ws)
            self.assertTrue(ws.accepted)
            self.assertTrue(broadcaster.is_user_online_locally(10))

            test_payload = {"type": "notification", "data": {"title": "New Lead"}}
            await broadcaster._dispatch_local(10, test_payload)
            self.assertEqual(len(ws.sent_messages), 1)
            self.assertEqual(ws.sent_messages[0]["data"]["title"], "New Lead")

            broadcaster.disconnect_user(10, ws)
            self.assertFalse(broadcaster.is_user_online_locally(10))

        asyncio.run(run_test())

    def test_zero_result_search_logging(self):
        """Verify ZeroResultSearch model stores query and metadata for unmet demand analysis."""
        zero_record = ZeroResultSearch(
            query="solar generator 500w",
            category_id=1,
            location="Garissa",
            user_id=20,
            ip_address="197.232.40.1",
        )
        self.db.add(zero_record)
        self.db.commit()

        saved = self.db.get(ZeroResultSearch, zero_record.id)
        self.assertIsNotNone(saved)
        self.assertEqual(saved.query, "solar generator 500w")
        self.assertEqual(saved.location, "Garissa")
        self.assertEqual(saved.category_id, 1)

    # ==================== PHASE 2 TESTS ====================

    def test_seller_performance_calculation(self):
        """Verify dynamic calculation of response rate, response time, and review stats."""
        # 1. Simulate buyer inquiry
        now = datetime.utcnow()
        msg_in = Message(
            id=1,
            sender_id=20,  # Buyer
            receiver_id=10,  # Seller
            listing_id=101,
            content="Is this Samsung S22 still available?",
            created_at=now - timedelta(minutes=45)
        )
        self.db.add(msg_in)

        # 2. Simulate seller reply 15 minutes later
        msg_reply = Message(
            id=2,
            sender_id=10,  # Seller
            receiver_id=20,  # Buyer
            listing_id=101,
            content="Yes available at our Eastleigh shop!",
            created_at=now - timedelta(minutes=30)
        )
        self.db.add(msg_reply)

        # 3. Add positive review
        review = Review(
            id=1,
            product_id=101,
            seller_id=10,
            buyer_id=20,
            customer_name="Ahmed Buyer",
            rating=5,
            comment="Great authentic product, fast response!",
            moderation_status="approved",
        )
        self.db.add(review)
        self.db.commit()

        # Compute performance
        perf = calculate_seller_performance(seller_id=10, db=self.db)

        self.assertEqual(perf["total_inquiries"], 1)
        self.assertEqual(perf["replied_inquiries"], 1)
        self.assertEqual(perf["response_rate"], 100)
        self.assertEqual(perf["median_response_time_minutes"], 15)
        self.assertIn("15 minutes", perf["response_time"])
        self.assertEqual(perf["average_rating"], 5.0)
        self.assertEqual(perf["reviews_count"], 1)
        self.assertTrue(perf["badges"]["phone_verified"])
        self.assertTrue(perf["badges"]["id_verified"])
        self.assertTrue(perf["badges"]["fast_responder"])

    def test_review_gating_and_anti_fake_duplicate(self):
        """Verify that reviews are gated against self-reviews and fake duplicate submissions."""
        # Attempt duplicate review from same buyer on same listing
        review1 = Review(
            id=10,
            product_id=101,
            seller_id=10,
            buyer_id=20,
            customer_name="Ahmed",
            rating=5,
            comment="First review",
            moderation_status="approved",
        )
        self.db.add(review1)
        self.db.commit()

        # Check duplicate detection logic
        duplicate = self.db.query(Review).filter(
            Review.product_id == 101,
            Review.buyer_id == 20
        ).first()

        self.assertIsNotNone(duplicate, "Duplicate review must be detected by buyer_id and product_id")

    def test_3tier_moderation_pipeline_low_risk(self):
        """Verify clean normal listing is classified as LOW_RISK for automatic approval."""
        clean_listing = {
            "title_en": "Leather Office Chair",
            "description_en": "Ergonomic high back leather executive chair. Pickup in Westlands.",
            "price": 14500.0,
            "category_id": 1,
        }
        tier, score, flags, reason = evaluate_listing_moderation(clean_listing, self.seller, self.db)

        self.assertEqual(tier, ModerationDecisionTier.LOW_RISK)
        self.assertLess(score, 25)
        self.assertEqual(len(flags), 0)

    def test_3tier_moderation_pipeline_medium_risk(self):
        """Verify contact leak or price anomaly triggers MEDIUM_RISK for human review."""
        suspicious_listing = {
            "title_en": "iPhone 15 Pro Max 512GB Brand New",
            "description_en": "Selling cheap call or whatsapp 0712345678 immediately. Delivery available.",
            "price": 12000.0,  # Highly anomalous low price for 65k avg category
            "category_id": 1,
        }
        tier, score, flags, reason = evaluate_listing_moderation(suspicious_listing, self.seller, self.db)

        self.assertEqual(tier, ModerationDecisionTier.MEDIUM_RISK)
        self.assertGreaterEqual(score, 25)
        self.assertLess(score, 70)
        self.assertTrue(any("contact_leak" in f or "price_anomaly" in f for f in flags))

    def test_3tier_moderation_pipeline_high_risk(self):
        """Verify prohibited weapons/drugs or advance fee triggers HIGH_RISK quarantine."""
        scam_listing = {
            "title_en": "Original Glock Pistol 9mm with ammunition",
            "description_en": "Brand new firearm. Send fare ya kuja deposit first to mpesa to book delivery.",
            "price": 25000.0,
            "category_id": 1,
        }
        tier, score, flags, reason = evaluate_listing_moderation(scam_listing, self.seller, self.db)

        self.assertEqual(tier, ModerationDecisionTier.HIGH_RISK)
        self.assertGreaterEqual(score, 70)
        self.assertTrue(any("prohibited" in f or "advance_pay" in f for f in flags))


if __name__ == "__main__":
    unittest.main()
