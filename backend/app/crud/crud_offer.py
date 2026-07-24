"""CRUD operations for offers."""

from sqlmodel import Session, select
from app.models.offer import Offer, OfferCreate, OfferUpdate
from app.crud.base import CRUDBase


class CRUDOffer(CRUDBase[Offer, OfferCreate, OfferUpdate]):
    def get_by_listing(self, db: Session, listing_id: int):
        """Get all offers for a listing."""
        return db.exec(select(Offer).where(Offer.listing_id == listing_id)).all()

    def get_by_buyer(self, db: Session, buyer_id: int):
        """Get all offers made by a buyer."""
        return db.exec(select(Offer).where(Offer.buyer_id == buyer_id)).all()

    def get_active(self, db: Session, listing_id: int):
        """Get active (pending) offers for a listing."""
        return db.exec(
            select(Offer).where(
                Offer.listing_id == listing_id,
                Offer.status == "pending"
            )
        ).all()


crud_offer = CRUDOffer(Offer)
