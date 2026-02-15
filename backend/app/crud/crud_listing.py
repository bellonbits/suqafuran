from typing import List, Optional
from sqlmodel import Session, select, func
from sqlalchemy.orm import selectinload
from app.models.listing import Listing, ListingBase, Category


def get_listing(db: Session, id: int) -> Optional[Listing]:
    return db.exec(select(Listing).where(Listing.id == id).options(selectinload(Listing.owner))).first()


def get_listings(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    owner_id: Optional[int] = None,
    search: Optional[str] = None,
    location: Optional[str] = None,
    attributes: Optional[dict] = None,
) -> List[Listing]:
    statement = (
        select(Listing)
        .order_by(Listing.boost_level.desc(), Listing.created_at.desc())
        .offset(skip)
        .limit(limit)
        .options(selectinload(Listing.owner))
    )
    if category_id:
        statement = statement.where(Listing.category_id == category_id)
    if owner_id:
        statement = statement.where(Listing.owner_id == owner_id)
    if search:
        search_filter = f"%{search}%"
        statement = statement.where(
            (Listing.title.ilike(search_filter)) | (Listing.description.ilike(search_filter))
        )
    if location:
        statement = statement.where(Listing.location.ilike(f"%{location}%"))
    
    if attributes:
        for key, value in attributes.items():
            # Simple JSON contains check for exact match
            # For more complex stuff (e.g. ranges), would need specific logic
            statement = statement.where(func.json_extract(Listing.attributes, f"$.{key}") == value)
    
    return db.exec(statement).all()


def create_listing(
    db: Session, *, listing_in: ListingBase, owner_id: int
) -> Listing:
    db_obj = Listing.model_validate(
        listing_in, update={"owner_id": owner_id}
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_listing(
    db: Session, *, db_obj: Listing, listing_in: ListingBase
) -> Listing:
    update_data = listing_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove_listing(db: Session, *, id: int) -> Listing:
    obj = db.get(Listing, id)
    db.delete(obj)
    db.commit()
    return obj


def get_categories(db: Session) -> List[Category]:
    return db.exec(select(Category)).all()


def get_category_by_slug(db: Session, slug: str) -> Optional[Category]:
    return db.exec(select(Category).where(Category.slug == slug)).first()
