"""Data provider for Suqafuran marketing emails.

Safely queries the database for genuine listings, categories, and user details.
Provides safe fallbacks when the database has few or no records to ensure
emails never render broken placeholders or empty sections.
"""

from typing import Any, Dict, List, Optional
from sqlmodel import Session, select, func
from app.core.config import settings
from app.models.listing import Listing, Category
from app.models.user import User

FALLBACK_CATEGORIES = [
    {"name_en": "Electronics", "slug": "electronics"},
    {"name_en": "Fashion", "slug": "fashion"},
    {"name_en": "Household Items", "slug": "household-items"},
    {"name_en": "Vehicles", "slug": "vehicles"},
    {"name_en": "Property", "slug": "property"},
    {"name_en": "Leisure & Sports", "slug": "leisure-sports"},
]


def resolve_recipient_name(db: Optional[Session], email: str, user_id: Optional[int] = None) -> str:
    """Resolve recipient's first name, or return a natural fallback."""
    if db:
        try:
            user = None
            if user_id:
                user = db.get(User, user_id)
            if not user and email:
                user = db.exec(select(User).where(User.email == email)).first()
            if user and user.full_name:
                first = user.full_name.strip().split()[0]
                if first and len(first) > 1 and first.isalpha():
                    return first
        except Exception:
            pass
    return "there"


def get_active_categories(db: Optional[Session], limit: int = 8) -> List[Dict[str, Any]]:
    """Fetch live categories from the database, or return canonical defaults."""
    if db:
        try:
            cats = db.exec(select(Category).order_by(Category.id).limit(limit)).all()
            if cats:
                return [
                    {
                        "id": c.id,
                        "name_en": c.name_en,
                        "slug": c.slug,
                        "image_url": c.image_url,
                    }
                    for c in cats
                ]
        except Exception:
            pass
    return [dict(c) for c in FALLBACK_CATEGORIES[:limit]]


def _listing_to_dict(l: Listing) -> Dict[str, Any]:
    images = l.images or []
    image_url = images[0] if isinstance(images, list) and images else None
    return {
        "id": l.id,
        "title": l.title_en,
        "title_en": l.title_en,
        "price": l.price,
        "compare_at_price": l.compare_at_price,
        "location": l.location or "Nairobi, Kenya",
        "images": images,
        "image_url": image_url,
        "url": f"{settings.FRONTEND_URL}/listing/{l.id}",
    }


def get_discovery_listings(
    db: Optional[Session],
    limit: int = 4,
    category_id: Optional[int] = None,
    exclude_owner_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Fetch genuine active approved listings with images."""
    if not db:
        return []

    try:
        query = select(Listing).where(
            Listing.status == "active",
            Listing.moderation_status == "approved"
        )
        if category_id:
            query = query.where(Listing.category_id == category_id)
        if exclude_owner_id:
            query = query.where(Listing.owner_id != exclude_owner_id)

        # Prefer listings with images
        results = db.exec(query.order_by(Listing.created_at.desc()).limit(limit * 3)).all()
        
        # Sort so listings with images appear first
        with_images = [l for l in results if l.images and len(l.images) > 0]
        without_images = [l for l in results if not l.images or len(l.images) == 0]
        sorted_listings = (with_images + without_images)[:limit]

        return [_listing_to_dict(l) for l in sorted_listings]
    except Exception:
        return []


def get_weekly_roundup_listings(db: Optional[Session], limit: int = 4) -> List[Dict[str, Any]]:
    """Fetch genuine active listings for the weekly roundup digest."""
    return get_discovery_listings(db, limit=limit)


def get_reengagement_listings(db: Optional[Session], user_id: Optional[int] = None, limit: int = 4) -> List[Dict[str, Any]]:
    """Fetch popular or recent listings for re-engagement."""
    if not db:
        return []
    try:
        query = select(Listing).where(
            Listing.status == "active",
            Listing.moderation_status == "approved"
        )
        if user_id:
            query = query.where(Listing.owner_id != user_id)

        results = db.exec(query.order_by(Listing.views.desc(), Listing.created_at.desc()).limit(limit)).all()
        return [_listing_to_dict(l) for l in results]
    except Exception:
        return []
