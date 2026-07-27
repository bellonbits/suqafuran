from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel
import enum

class DeliveryStatus(str, enum.Enum):
    pending = "pending"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"

class Delivery(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id")
    seller_id: int = Field(foreign_key="user.id")
    buyer_id: int = Field(foreign_key="user.id")
    status: DeliveryStatus = Field(default=DeliveryStatus.pending)
    tracking_number: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
