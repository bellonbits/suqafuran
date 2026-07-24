"""CRUD operations for saved searches."""

from sqlmodel import Session, select
from app.models.saved_search import SavedSearch, SavedSearchCreate, SavedSearchUpdate
from app.crud.base import CRUDBase


class CRUDSavedSearch(CRUDBase[SavedSearch, SavedSearchCreate, SavedSearchUpdate]):
    def get_by_user(self, db: Session, user_id: int):
        """Get all saved searches for a user."""
        return db.exec(
            select(SavedSearch).where(SavedSearch.user_id == user_id, SavedSearch.is_active == True)
        ).all()

    def get_active(self, db: Session):
        """Get all active saved searches (for background matching)."""
        return db.exec(select(SavedSearch).where(SavedSearch.is_active == True)).all()


crud_saved_search = CRUDSavedSearch(SavedSearch)
