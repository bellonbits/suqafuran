import unittest
from unittest.mock import patch, MagicMock
from sqlmodel import Session, SQLModel, create_engine
from app.models.listing import Listing
from app.models.subscription import SellerFeatureAccess
from app.services.subscription_service import subscription_service


class TestPhase3SpringIntegration(unittest.TestCase):

    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        SQLModel.metadata.create_all(self.engine, tables=[
            Listing.__table__,
            SellerFeatureAccess.__table__,
        ])
        self.session = Session(self.engine)

    def tearDown(self):
        self.session.close()

    @patch("httpx.get")
    def test_spring_boot_entitlement_permits_listing(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "sellerId": 42,
            "plan": "free",
            "limits": {"canCreateListing": True, "maxActiveListings": 10}
        }
        mock_get.return_value = mock_resp

        result = subscription_service.can_add_products(42, self.session)
        self.assertTrue(result)
        mock_get.assert_called_once()
        self.assertIn("X-Internal-Service-Key", mock_get.call_args[1]["headers"])

    @patch("httpx.get")
    def test_spring_boot_entitlement_blocks_listing_limit_exceeded(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "sellerId": 42,
            "plan": "free",
            "limits": {"canCreateListing": False, "maxActiveListings": 10}
        }
        mock_get.return_value = mock_resp

        result = subscription_service.can_add_products(42, self.session)
        self.assertFalse(result)

    @patch("httpx.get")
    def test_spring_boot_offline_falls_back_to_local_features(self, mock_get):
        import httpx
        mock_get.side_effect = httpx.ConnectError("Connection refused")

        # Local features: max 2 products
        feat = SellerFeatureAccess(
            seller_id=99,
            subscription_id=1,
            max_products=2
        )
        self.session.add(feat)

        # Add 1 active listing
        listing = Listing(
            id=1,
            title_en="Test Phone",
            title_so="Test Phone",
            description_en="Desc",
            description_so="Desc",
            price=100.0,
            location="Nairobi",
            condition="New",
            category_id=1,
            currency="USD",
            owner_id=99,
            status="active"
        )
        self.session.add(listing)
        self.session.commit()

        # 1 < 2 -> should allow
        self.assertTrue(subscription_service.can_add_products(99, self.session))

        # Add 2nd active listing
        listing2 = Listing(
            id=2,
            title_en="Test Phone 2",
            title_so="Test Phone 2",
            description_en="Desc",
            description_so="Desc",
            price=200.0,
            location="Nairobi",
            condition="New",
            category_id=1,
            currency="USD",
            owner_id=99,
            status="active"
        )
        self.session.add(listing2)
        self.session.commit()

        # 2 >= 2 -> should block
        self.assertFalse(subscription_service.can_add_products(99, self.session))


if __name__ == "__main__":
    unittest.main()
