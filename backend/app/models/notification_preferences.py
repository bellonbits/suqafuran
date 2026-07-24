"""Notification preferences model for user control."""

from typing import Optional
from sqlmodel import Field, SQLModel, Relationship


class NotificationPreferencesBase(SQLModel):
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    email_messages: bool = Field(default=True)  # New messages
    email_offers: bool = Field(default=True)  # New offers
    email_price_drops: bool = Field(default=True)  # Price drop alerts
    email_search_matches: bool = Field(default=True)  # Saved search matches
    email_order_updates: bool = Field(default=True)  # Order status changes
    email_listings: bool = Field(default=True)  # New listings in categories


class NotificationPreferences(NotificationPreferencesBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Relationships
    user: Optional["User"] = Relationship(
        back_populates="notification_preferences",
        sa_relationship_kwargs={"foreign_keys": "NotificationPreferences.user_id"}
    )


class NotificationPreferencesRead(NotificationPreferencesBase):
    id: int


class NotificationPreferencesUpdate(SQLModel):
    email_messages: Optional[bool] = None
    email_offers: Optional[bool] = None
    email_price_drops: Optional[bool] = None
    email_search_matches: Optional[bool] = None
    email_order_updates: Optional[bool] = None
    email_listings: Optional[bool] = None
