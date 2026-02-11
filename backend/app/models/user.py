from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.listing import Listing
    from app.models.verification import VerificationRequest
    from app.models.wallet import Wallet


class UserBase(SQLModel):
    full_name: str
    email: str = Field(unique=True, index=True)
    phone: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    is_admin: bool = False
    avatar_url: Optional[str] = None
    response_time: Optional[str] = "Typically responds in a few hours"



class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    listings: List["Listing"] = Relationship(back_populates="owner")
    verification_requests: List["VerificationRequest"] = Relationship(back_populates="user")
    wallet: Optional["Wallet"] = Relationship(back_populates="user")


class UserCreate(UserBase):
    password: str


class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    response_time: Optional[str] = None
