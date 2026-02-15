import enum
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class MeetingResponse(str, enum.Enum):
    YES = "yes"
    NO = "no"
    NOT_YET = "not_yet"

class Meeting(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id")
    buyer_id: int = Field(foreign_key="user.id")
    seller_id: int = Field(foreign_key="user.id")
    buyer_response: Optional[MeetingResponse] = None
    seller_response: Optional[MeetingResponse] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DealOutcome(str, enum.Enum):
    BOUGHT = "bought"
    NOT_BOUGHT = "not_bought"
    CANCELLED = "cancelled"

class Deal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id")
    buyer_id: int = Field(foreign_key="user.id")
    seller_id: int = Field(foreign_key="user.id")
    outcome: DealOutcome
    created_at: datetime = Field(default_factory=datetime.utcnow)
