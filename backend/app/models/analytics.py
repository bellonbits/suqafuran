"""Analytics models for tracking user sessions, activities, and conversions."""

from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
from uuid import uuid4


class UserSession(SQLModel, table=True):
    """Track active user sessions."""

    __tablename__ = "user_session"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    session_token: str = Field(unique=True, index=True)

    # Session tracking
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_type: Optional[str] = None  # mobile, tablet, desktop

    # Timing
    started_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    last_activity_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    ended_at: Optional[datetime] = None

    # Pages visited
    current_page: Optional[str] = None
    page_history: str = ""  # JSON array of visited pages

    # Engagement
    total_clicks: int = 0
    total_interactions: int = 0

    # Status
    is_active: bool = True


class UserActivity(SQLModel, table=True):
    """Log user actions and interactions."""

    __tablename__ = "user_activity"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: Optional[int] = Field(foreign_key="user.id", index=True)
    session_id: Optional[str] = Field(foreign_key="user_session.id", index=True)

    # Action details
    action_type: str = Field(index=True)  # view_listing, add_to_cart, search, login, signup, purchase, etc.
    action_category: str = Field(index=True)  # user, shop, listing, order, etc.
    resource_id: Optional[str] = None  # listing_id, shop_id, order_id, etc.
    resource_type: Optional[str] = None

    # Context
    page_url: Optional[str] = None
    referrer: Optional[str] = None
    search_query: Optional[str] = None

    # Metadata
    event_metadata: str = ""  # JSON for additional data

    # Timing & Location
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    ip_address: Optional[str] = None



class ConversionFunnel(SQLModel, table=True):
    """Track user conversion funnel stages."""

    __tablename__ = "conversion_funnel"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    session_id: Optional[str] = Field(foreign_key="user_session.id", index=True)

    # Funnel stages (timestamp when each stage was reached)
    signup_at: Optional[datetime] = None
    first_search_at: Optional[datetime] = None
    first_view_listing_at: Optional[datetime] = None
    first_add_to_cart_at: Optional[datetime] = None
    first_purchase_at: Optional[datetime] = None
    repeat_purchase_at: Optional[datetime] = None

    # Status
    current_stage: str = Field(default="signup")  # signup, search, view, cart, purchase, repeat
    completed: bool = False

    # Tracking
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ClickEvent(SQLModel, table=True):
    """Track click/heatmap data for analytics."""

    __tablename__ = "click_event"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: Optional[int] = Field(foreign_key="user.id", index=True)
    session_id: Optional[str] = Field(foreign_key="user_session.id", index=True)

    # Click details
    element_id: Optional[str] = None
    element_class: Optional[str] = None
    element_type: str  # button, link, input, etc.
    text: Optional[str] = None

    # Position
    x: int  # pixel coordinates
    y: int
    page_width: int
    page_height: int

    # Page context
    page_url: str = Field(index=True)

    # Timing
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
