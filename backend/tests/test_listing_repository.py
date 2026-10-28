import unittest
from unittest.mock import MagicMock
from app.repositories.listing_repository import (
    ListingRepositoryProtocol,
    SqlModelListingRepository,
)
from app.models.listing import Listing, ListingBase


class TestListingRepository(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.repo = SqlModelListingRepository(self.mock_db)

    def test_protocol_conformance(self):
        self.assertIsInstance(self.repo, ListingRepositoryProtocol)

    def test_get_by_id(self):
        mock_listing = MagicMock(spec=Listing)
        mock_listing.id = 42
        self.mock_db.exec.return_value.first.return_value = mock_listing

        result = self.repo.get_by_id(42)
        self.assertEqual(result, mock_listing)
        self.mock_db.exec.assert_called_once()

    def test_check_duplicate_found(self):
        mock_listing = MagicMock(spec=Listing)
        self.mock_db.exec.return_value.first.return_value = mock_listing

        result = self.repo.check_duplicate(owner_id=1, title="iPhone 15 Pro")
        self.assertEqual(result, mock_listing)
        self.mock_db.exec.assert_called_once()

    def test_create_listing(self):
        mock_listing_base = MagicMock(spec=ListingBase)
        mock_listing_base.dict.return_value = {
            "title_en": "Toyota Land Cruiser",
            "title_so": "Toyota Land Cruiser",
            "price": 35000.0,
            "category_id": 1,
        }

        created = self.repo.create(listing_in=mock_listing_base, owner_id=5)
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once()
        self.assertEqual(created.owner_id, 5)

    def test_delete_existing_listing(self):
        mock_listing = MagicMock(spec=Listing)
        mock_listing.id = 10
        mock_listing.status = "active"
        self.mock_db.get.return_value = mock_listing

        success = self.repo.delete(10)
        self.assertTrue(success)
        self.assertEqual(mock_listing.status, "deleted")
        self.mock_db.add.assert_called_with(mock_listing)
        self.mock_db.commit.assert_called_once()

    def test_delete_nonexistent_listing(self):
        self.mock_db.get.return_value = None

        success = self.repo.delete(999)
        self.assertFalse(success)
        self.mock_db.commit.assert_not_called()

    def test_count_active_per_category(self):
        Row1 = MagicMock(category_id=1, cnt=15)
        Row2 = MagicMock(category_id=2, cnt=8)
        self.mock_db.execute.return_value.fetchall.return_value = [Row1, Row2]

        counts = self.repo.count_active_per_category()
        self.assertEqual(counts, {1: 15, 2: 8})


if __name__ == "__main__":
    unittest.main()
