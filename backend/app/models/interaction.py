import enum
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class InteractionType(str, enum.Enum):
    CALL = "call"
    WHATSAPP = "whatsapp"

class Interaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id")
    buyer_id: int = Field(foreign_key="user.id")
    type: InteractionType
    created_at: datetime = Field(default_factory=datetime.utcnow)
