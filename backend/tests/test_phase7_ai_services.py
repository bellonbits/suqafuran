"""
Unit and Integration Tests for Phase 7: AI & Intelligence Services.

Covers:
1. Search Query Intelligence & Multilingual Synonym Expansion.
2. Content-Based & Personalized Recommendations Engine.
3. Smart Listing Assistant (Category Suggestion & Data-Backed Price Recommendations).
4. Enhanced Fraud Pattern Detection & FraudEvent Auditing.
5. REST API Integration Endpoints.
"""

import unittest
from datetime import datetime, timedelta
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.api import deps
from app.models.user import User, UserVerifiedLevel
from app.models.listing import Listing, Category
from app.models.interaction import Interaction
from app.models.fraud import FraudEvent, FraudTargetType
from app.services.search_intelligence import (
    parse_natural_language_search,
    expand_synonyms,
    normalize_and_spellcheck,
)
from app.services.recommendation_service import (
    get_similar_listings,
    get_personalized_recommendations,
)
from app.services.listing_assistant import (
    predict_category,
    recommend_price,
    suggest_listing_metadata,
)
from app.services.fraud_detector import (
    assess_listing_risk,
    check_posting_velocity,
    check_cross_account_duplicate_images,
)


class TestPhase7AIServices(unittest.TestCase):
    def setUp(self):
        # Create in-memory SQLite database for test isolation
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        SQLModel.metadata.create_all(self.engine)
        self.db = Session(self.engine)

        def get_test_db():
            with Session(self.engine) as session:
                yield session

        app.dependency_overrides[deps.get_db] = get_test_db

        # Seed categories
        self.cat_electronics = Category(
            name_en="Electronics",
            name_so="Qalabka Korontada",
            slug="electronics",
            icon_name="device_phone",
        )
        self.cat_vehicles = Category(
            name_en="Vehicles",
            name_so="Gaadiidka",
            slug="vehicles",
            icon_name="directions_car",
        )
        self.cat_property = Category(
            name_en="Property",
            name_so="Guryaha iyo Dhulka",
            slug="property",
            icon_name="home",
        )
        self.cat_fashion = Category(
            name_en="Fashion",
            name_so="Dharka iyo Moodada",
            slug="fashion",
            icon_name="checkroom",
        )
        self.db.add_all([self.cat_electronics, self.cat_vehicles, self.cat_property, self.cat_fashion])
        self.db.commit()

        # Seed users
        self.seller = User(
            id=1,
            email="seller@example.com",
            full_name="Verified Seller",
            hashed_password="hash",
            is_verified=True,
            is_active=True,
            verified_level=UserVerifiedLevel.id,
        )
        self.buyer = User(
            id=2,
            email="buyer@example.com",
            full_name="Marketplace Buyer",
            hashed_password="hash",
            is_verified=True,
            is_active=True,
            verified_level=UserVerifiedLevel.phone,
        )
        self.unverified_user = User(
            id=3,
            email="newbie@example.com",
            full_name="Newbie User",
            hashed_password="hash",
            is_verified=False,
            is_active=True,
            verified_level=UserVerifiedLevel.guest,
        )
        self.db.add_all([self.seller, self.buyer, self.unverified_user])
        self.db.commit()

        # Seed listings for comparable statistics and recommendations
        self.listings = [
            Listing(
                id=101,
                title_en="iPhone 13 Pro 128GB",
                description_en="Excellent battery health clean phone",
                price=55000.0,
                category_id=self.cat_electronics.id,
                location="Nairobi",
                condition="Used",
                status="active",
                is_sold=False,
                boost_level=2,
                owner_id=self.seller.id,
                views=120,
                leads=8,
                images=["https://img.suqafuran.com/iphone13pro.jpg"],
            ),
            Listing(
                id=102,
                title_en="iPhone 13 128GB Midnight",
                description_en="Used for 6 months original accessories",
                price=50000.0,
                category_id=self.cat_electronics.id,
                location="Nairobi",
                condition="Used",
                status="active",
                is_sold=False,
                boost_level=0,
                owner_id=self.seller.id,
                views=85,
                leads=5,
                images=["https://img.suqafuran.com/iphone13.jpg"],
            ),
            Listing(
                id=103,
                title_en="iPhone 13 256GB Starlight",
                description_en="Like new condition",
                price=58000.0,
                category_id=self.cat_electronics.id,
                location="Mombasa",
                condition="New",
                status="active",
                is_sold=False,
                boost_level=1,
                owner_id=self.seller.id,
                views=45,
                leads=3,
                images=["https://img.suqafuran.com/iphone13star.jpg"],
            ),
            Listing(
                id=104,
                title_en="Toyota Vitz 2018",
                description_en="Clean engine lady owned Nairobi",
                price=850000.0,
                category_id=self.cat_vehicles.id,
                location="Nairobi",
                condition="Used",
                status="active",
                is_sold=False,
                boost_level=3,
                owner_id=self.seller.id,
                views=300,
                leads=15,
                images=["https://img.suqafuran.com/vitz2018.jpg"],
            ),
            Listing(
                id=105,
                title_en="Toyota Premio 2017",
                description_en="Well maintained sedan",
                price=1450000.0,
                category_id=self.cat_vehicles.id,
                location="Nairobi",
                condition="Used",
                status="active",
                is_sold=False,
                boost_level=0,
                owner_id=self.seller.id,
                views=180,
                leads=9,
                images=["https://img.suqafuran.com/premio.jpg"],
            ),
        ]
        self.db.add_all(self.listings)
        self.db.commit()

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()

    # ─── 1. Search Query Intelligence Tests ───────────────────────────────────

    def test_search_query_parsing_natural_language(self):
        query = "clean used iphone 13 in nairobi under 50k"
        parsed = parse_natural_language_search(query)

        self.assertEqual(parsed["detected_location"], "Nairobi")
        self.assertEqual(parsed["max_price"], 50000.0)
        self.assertEqual(parsed["detected_condition"], "Used")
        self.assertEqual(parsed["inferred_category"], "electronics")
        self.assertIn("iphone", parsed["clean_keywords"])

    def test_search_query_parsing_price_ranges(self):
        query = "toyota between 500k and 1m in mombasa"
        parsed = parse_natural_language_search(query)

        self.assertEqual(parsed["detected_location"], "Mombasa")
        self.assertEqual(parsed["min_price"], 500000.0)
        self.assertEqual(parsed["max_price"], 1000000.0)
        self.assertEqual(parsed["inferred_category"], "vehicles")

    def test_east_african_synonym_expansion(self):
        # Somali/Swahili vehicles expansion
        gari_synonyms = expand_synonyms("gari")
        self.assertIn("car", gari_synonyms)
        self.assertIn("baabuur", gari_synonyms)

        # Phone expansion
        simu_synonyms = expand_synonyms("simu")
        self.assertIn("phone", simu_synonyms)
        self.assertIn("telfoon", simu_synonyms)

        # Shoes expansion
        viatu_synonyms = expand_synonyms("viatu")
        self.assertIn("shoes", viatu_synonyms)
        self.assertIn("sneakers", viatu_synonyms)

    def test_spellcheck_and_typo_correction(self):
        text = "clean iphne 12 and samsng tv in nairbi"
        corrected = normalize_and_spellcheck(text)
        self.assertIn("iphone", corrected)
        self.assertIn("samsung", corrected)
        self.assertIn("nairobi", corrected)

    # ─── 2. Recommendations Engine Tests ──────────────────────────────────────

    def test_get_similar_listings(self):
        # Query similar listings to iPhone 13 Pro (id=101)
        similar = get_similar_listings(self.db, listing_id=101, limit=5)

        self.assertTrue(len(similar) > 0)
        # Should rank other iPhones in same category and price band at top
        top_match = similar[0]
        self.assertEqual(top_match["category_id"], self.cat_electronics.id)
        self.assertTrue(top_match["similarity_score"] > 30.0)
        self.assertTrue(len(top_match["reasons"]) > 0)
        # Should not recommend the target listing itself
        self.assertNotIn(101, [item["id"] for item in similar])

    def test_get_personalized_recommendations_with_history(self):
        # Buyer interacted with electronics (id=101)
        interaction = Interaction(
            buyer_id=self.buyer.id,
            listing_id=101,
            type="view",
        )
        self.db.add(interaction)
        self.db.commit()

        recs = get_personalized_recommendations(self.db, user_id=self.buyer.id, limit=5)
        self.assertTrue(len(recs) > 0)
        # Verify recommended item contains category preference
        categories = [r["category_id"] for r in recs]
        self.assertIn(self.cat_electronics.id, categories)

    def test_get_personalized_recommendations_cold_start(self):
        # Cold start for guest with no history
        recs = get_personalized_recommendations(self.db, user_id=None, limit=5)
        self.assertTrue(len(recs) > 0)
        # Highly boosted and popular listings should appear
        self.assertTrue(any(r["boost_level"] > 0 for r in recs))

    # ─── 3. Smart Listing Assistant Tests ─────────────────────────────────────

    def test_predict_category_heuristics(self):
        pred_electronics = predict_category(self.db, title="Brand New Apple MacBook Pro M2")
        self.assertEqual(pred_electronics["category_slug"], "electronics")
        self.assertTrue(pred_electronics["confidence"] >= 0.7)

        pred_vehicles = predict_category(self.db, title="Subaru Forester 2017 Turbo")
        self.assertEqual(pred_vehicles["category_slug"], "vehicles")

    def test_recommend_price_from_database_data(self):
        # We seeded 3 iPhones around 50k - 58k
        pricing = recommend_price(
            self.db,
            title="iPhone 13 128gb",
            category_id=self.cat_electronics.id,
            condition="Used",
            currency="KES",
        )

        self.assertGreaterEqual(pricing["sample_size"], 3)
        self.assertEqual(pricing["data_source"], "marketplace_historical_data")
        # Median of 50k, 55k, 58k is 55,000
        self.assertAlmostEqual(pricing["median_price"], 55000.0, delta=1000)
        self.assertIn(pricing["demand_level"], ["high", "medium", "low"])

    def test_suggest_listing_metadata_unified(self):
        res = suggest_listing_metadata(
            self.db,
            raw_text="Toyota Vitz 2018 automatic in Nairobi",
            location="Nairobi",
            currency="KES",
        )

        self.assertEqual(res["category_slug"], "vehicles")
        self.assertIn("Toyota Vitz", res["title_en"])
        self.assertIsNotNone(res["recommended_price"])
        self.assertIn("price_range", res)

    # ─── 4. Enhanced Fraud Pattern Detection Tests ────────────────────────────

    def test_fraud_detector_safe_listing(self):
        safe_data = {
            "title_en": "Original iPhone 13 in excellent condition",
            "description_en": "Inspection welcomed before payment. Pick up in Nairobi CBD.",
            "price": 52000.0,
            "category_id": self.cat_electronics.id,
            "images": ["https://img.suqafuran.com/unique_new_photo.jpg"],
        }
        assessment = assess_listing_risk(self.db, safe_data, seller=self.seller, persist_fraud_event=False)
        self.assertEqual(assessment["decision_tier"], "LOW_RISK")
        self.assertEqual(assessment["action_recommended"], "auto_approve")
        self.assertLess(assessment["risk_score"], 25)

    def test_fraud_detector_severe_underpricing_scam(self):
        # Average electronics in DB is ~54,000 KES. Listing an iPhone for 2,000 KES is obvious bait.
        scam_data = {
            "title_en": "iPhone 13 Pro Max brand new",
            "description_en": "Selling urgent",
            "price": 2000.0,
            "category_id": self.cat_electronics.id,
            "images": [],
        }
        assessment = assess_listing_risk(self.db, scam_data, seller=self.seller, persist_fraud_event=True)
        self.assertIn("price_anomaly:severe_underpricing_scam_bait", assessment["triggered_flags"])
        self.assertGreaterEqual(assessment["risk_score"], 25)
        self.assertIn(assessment["action_recommended"], ["review_queue", "quarantine"])

    def test_fraud_detector_posting_velocity_burst(self):
        # Newbie posts multiple listings in under 10 minutes
        for i in range(4):
            burst_listing = Listing(
                title_en=f"Quick Item {i}",
                description_en=f"Quick item description {i}",
                price=5000.0,
                category_id=self.cat_electronics.id,
                location="Nairobi",
                condition="Used",
                status="active",
                owner_id=self.unverified_user.id,
                created_at=datetime.utcnow() - timedelta(minutes=2),
            )
            self.db.add(burst_listing)
        self.db.commit()

        is_burst, count = check_posting_velocity(self.unverified_user.id, self.db, window_minutes=10, threshold=3)
        self.assertTrue(is_burst)
        self.assertGreaterEqual(count, 4)

        eval_data = {
            "title_en": "Another fast item",
            "price": 6000.0,
            "category_id": self.cat_electronics.id,
        }
        assessment = assess_listing_risk(self.db, eval_data, seller=self.unverified_user, persist_fraud_event=True)
        velocity_flags = [f for f in assessment["triggered_flags"] if "velocity:" in f]
        self.assertTrue(len(velocity_flags) > 0)
        self.assertIsNotNone(assessment["event_id"])

    def test_fraud_detector_cross_account_image_reuse(self):
        # Re-using photo uploaded by seller (id=1) in newbie's listing (id=3)
        stolen_photo = "https://img.suqafuran.com/iphone13pro.jpg"
        has_dup, dup_urls = check_cross_account_duplicate_images(
            seller_id=self.unverified_user.id,
            image_urls=[stolen_photo],
            db=self.db,
        )
        self.assertTrue(has_dup)
        self.assertIn(stolen_photo, dup_urls)

    # ─── 5. API Endpoints Tests ───────────────────────────────────────────────

    def test_api_recommendations_similar(self):
        resp = self.client.get("/api/v1/recommendations/similar/101?limit=3")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data, list)
        if data:
            self.assertIn("similarity_score", data[0])
            self.assertIn("reasons", data[0])

    def test_api_recommendations_for_you(self):
        resp = self.client.get("/api/v1/recommendations/for-you?viewed_ids=101,102&limit=4")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data, list)
        self.assertTrue(len(data) > 0)

    def test_api_search_intelligent_parse(self):
        payload = {"query": "clean gari toyota under 1m in nairobi"}
        resp = self.client.post("/api/v1/search/intelligent-parse", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["detected_location"], "Nairobi")
        self.assertEqual(data["max_price"], 1000000.0)
        self.assertIn("baabuur", data["synonyms"])

    def test_api_ai_suggest_listing(self):
        payload = {
            "raw_text": "iPhone 13 pro max 256gb blue in Nairobi",
            "location": "Nairobi",
            "currency": "KES",
        }
        resp = self.client.post("/api/v1/ai/listings/ai/suggest", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["category_slug"], "electronics")
        self.assertIn("title_en", data)
        self.assertIn("description_en", data)
        self.assertIn("recommended_price", data)


if __name__ == "__main__":
    unittest.main()
