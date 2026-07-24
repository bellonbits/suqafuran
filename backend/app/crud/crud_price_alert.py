"""CRUD operations for price alerts."""

from sqlmodel import Session, select
from app.models.price_alert import PriceAlert, PriceAlertCreate, PriceAlertBase
from app.crud.base import CRUDBase


class CRUDPriceAlert(CRUDBase[PriceAlert, PriceAlertCreate, PriceAlertBase]):
    def get_by_user(self, db: Session, user_id: int):
        """Get all price alerts for a user."""
        return db.exec(
            select(PriceAlert).where(PriceAlert.user_id == user_id, PriceAlert.is_active == True)
        ).all()

    def get_by_listing(self, db: Session, listing_id: int):
        """Get all users watching a listing."""
        return db.exec(
            select(PriceAlert).where(PriceAlert.listing_id == listing_id, PriceAlert.is_active == True)
        ).all()

    def get_watched(self, db: Session, user_id: int, listing_id: int):
        """Check if user is watching a listing."""
        return db.exec(
            select(PriceAlert).where(
                PriceAlert.user_id == user_id,
                PriceAlert.listing_id == listing_id,
                PriceAlert.is_active == True
            )
        ).first()


crud_price_alert = CRUDPriceAlert(PriceAlert)
