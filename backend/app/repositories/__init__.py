"""
Repository package for Suqafuran backend.
Encapsulates data access and persistence logic away from route controllers and business services.
"""
from app.repositories.listing_repository import (
    ListingRepositoryProtocol,
    SqlModelListingRepository,
)

__all__ = [
    "ListingRepositoryProtocol",
    "SqlModelListingRepository",
]
