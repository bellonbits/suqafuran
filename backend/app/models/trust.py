from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class Rating(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    deal_id: int = Field(foreign_key="deal.id")
    rater_id: int = Field(foreign_key="user.id")
    rated_user_id: int = Field(foreign_key="user.id")
    score: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Report(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: Optional[int] = Field(default=None, foreign_key="listing.id")
    reporter_id: int = Field(foreign_key="user.id")
    reason: str
    description: Optional[str] = None
    status: str = Field(default="pending") # pending, resolved, dismissed
    created_at: datetime = Field(default_factory=datetime.utcnow)
