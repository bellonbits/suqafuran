from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
from sqlalchemy import Column, JSON
from app.models.common import OwnerRead
if TYPE_CHECKING:
    from app.models.user import User

class VerificationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class VerificationRequestBase(SQLModel):
    document_type: str  # ID, Passport, Business Registration
    status: VerificationStatus = Field(default=VerificationStatus.PENDING)
    notes: Optional[str] = None
    document_urls: List[str] = Field(default=[], sa_column=Column(JSON))

class VerificationRequest(VerificationRequestBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional["User"] = Relationship(back_populates="verification_requests")


class VerificationRequestRead(VerificationRequestBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[OwnerRead] = None
