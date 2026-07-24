"""CRUD operations for notification preferences."""

from sqlmodel import Session, select
from app.models.notification_preferences import (
    NotificationPreferences,
    NotificationPreferencesUpdate,
)
from app.crud.base import CRUDBase


class CRUDNotificationPreferences(CRUDBase[NotificationPreferences, dict, NotificationPreferencesUpdate]):
    def get_or_create(self, db: Session, user_id: int):
        """Get or create notification preferences for a user."""
        prefs = db.exec(
            select(NotificationPreferences).where(NotificationPreferences.user_id == user_id)
        ).first()

        if not prefs:
            prefs = NotificationPreferences(user_id=user_id)
            db.add(prefs)
            db.commit()
            db.refresh(prefs)

        return prefs


crud_notification_preferences = CRUDNotificationPreferences(NotificationPreferences)
