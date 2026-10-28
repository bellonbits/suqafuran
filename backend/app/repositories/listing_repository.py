"""
Repository Pattern implementation for Marketplace Listings.

Encapsulates all SQLModel / SQLAlchemy database interactions for listings,
categories, and subcategories, providing a clean domain abstraction.
"""

from typing import List, Optional, Protocol, runtime_checkable, Dict, Any
from sqlmodel import Session, select, func
from sqlalchemy import or_, text
from sqlalchemy.orm import selectinload

from app.models.listing import Listing, ListingBase, Category, SubSubCategory
from app.models.subcategory import Subcategory
from app.models.user import User


@runtime_checkable
class ListingRepositoryProtocol(Protocol):
    """Protocol defining the repository contract for listing data access."""

    def get_by_id(self, id: int) -> Optional[Listing]: ...

    def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        owner_id: Optional[int] = None,
        search: Optional[str] = None,
        location: Optional[str] = None,
        attributes: Optional[dict] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        status: Optional[str] = None,
    ) -> List[Listing]: ...

    def create(self, *, listing_in: ListingBase, owner_id: int) -> Listing: ...

    def check_duplicate(self, *, owner_id: int, title: str) -> Optional[Listing]: ...

    def count_active_per_category(self) -> Dict[int, int]: ...

    def delete(self, id: int) -> bool: ...


class SqlModelListingRepository:
    """SQLModel / PostgreSQL implementation of ListingRepositoryProtocol."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: int) -> Optional[Listing]:
        """Fetch listing by ID with eager-loaded owner relation."""
        statement = select(Listing).where(Listing.id == id).options(selectinload(Listing.owner))
        return self.db.exec(statement).first()

    def check_duplicate(self, *, owner_id: int, title: str) -> Optional[Listing]:
        """Check if active or pending listing with exact title already exists for owner."""
        statement = select(Listing).where(
            Listing.owner_id == owner_id,
            Listing.title_en == title,
            Listing.status.in_(["active", "pending"])
        )
        return self.db.exec(statement).first()

    def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        owner_id: Optional[int] = None,
        search: Optional[str] = None,
        location: Optional[str] = None,
        attributes: Optional[dict] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        status: Optional[str] = None,
    ) -> List[Listing]:
        """Search and filter listings with full-text stemming and ranking."""
        statement = (
            select(Listing)
            .join(User, Listing.owner_id == User.id)
            .where(User.is_suspended == False)  # Security: Hide listings from suspended accounts
            .order_by(
                Listing.boost_level.desc(),
                User.trust_score.desc(),
                Listing.created_at.desc(),
                User.is_verified.desc(),
            )
            .offset(skip)
            .limit(limit)
            .options(selectinload(Listing.owner))
        )

        if category_id:
            statement = statement.where(Listing.category_id == category_id)
        if owner_id:
            statement = statement.where(Listing.owner_id == owner_id)
        if location:
            statement = statement.where(Listing.location.ilike(f"%{location}%"))
        if min_price is not None:
            statement = statement.where(Listing.price >= min_price)
        if max_price is not None:
            statement = statement.where(Listing.price <= max_price)
        if status is not None:
            statement = statement.where(Listing.status == status)
        else:
            statement = statement.where(Listing.status != "deleted")

        if search:
            search_filter = f"%{search}%"
            statement = (
                statement
                .join(Category, Listing.category_id == Category.id, isouter=True)
                .join(Subcategory, Listing.subcategory_id == Subcategory.id, isouter=True)
                .join(SubSubCategory, Listing.subsubcategory_id == SubSubCategory.id, isouter=True)
                .where(
                    or_(
                        func.to_tsvector(
                            'english',
                            func.coalesce(Listing.title_en, '') + ' ' +
                            func.coalesce(Listing.description_en, '') + ' ' +
                            func.coalesce(Category.name_en, '') + ' ' +
                            func.coalesce(Subcategory.name_en, '') + ' ' +
                            func.coalesce(SubSubCategory.name_en, '')
                        ).op('@@')(func.plainto_tsquery('english', search)),
                        Listing.title_so.ilike(search_filter),
                        Listing.description_so.ilike(search_filter),
                    )
                )
            )

        if attributes:
            attrs_copy = dict(attributes)
            subcategory_name = attrs_copy.pop("subcategory", None)
            if subcategory_name and category_id:
                sc = self.db.exec(
                    select(Subcategory).where(
                        Subcategory.category_id == category_id,
                        (Subcategory.name_en == subcategory_name) | (Subcategory.name_so == subcategory_name),
                    )
                ).first()
                if sc:
                    statement = statement.where(Listing.subcategory_id == sc.id)

        return list(self.db.exec(statement).all())

    def create(self, *, listing_in: ListingBase, owner_id: int) -> Listing:
        """Create and persist a new listing instance."""
        listing_data = listing_in.dict()
        db_listing = Listing(**listing_data, owner_id=owner_id)
        self.db.add(db_listing)
        self.db.commit()
        self.db.refresh(db_listing)
        return db_listing

    def count_active_per_category(self) -> Dict[int, int]:
        """Aggregate active live listings per category."""
        rows = self.db.execute(
            text(
                """
                SELECT l.category_id, COUNT(*) AS cnt
                FROM listing l
                JOIN "user" u ON u.id = l.owner_id
                WHERE l.status = 'active'
                  AND u.is_suspended = false
                GROUP BY l.category_id
                """
            )
        ).fetchall()
        return {row.category_id: int(row.cnt) for row in rows if row.category_id}

    def delete(self, id: int) -> bool:
        """Soft-delete listing by setting status to 'deleted'."""
        listing = self.db.get(Listing, id)
        if not listing:
            return False
        listing.status = "deleted"
        self.db.add(listing)
        self.db.commit()
        return True
