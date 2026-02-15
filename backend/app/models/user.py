import enum
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.models.listing import Listing
    from app.models.verification import VerificationRequest
    from app.models.wallet import Wallet


class UserVerifiedLevel(str, enum.Enum):
    guest = "guest"
    phone = "phone"
    id = "id"
    trusted = "trusted"


class UserBase(SQLModel):
    full_name: Optional[str] = None
    email: Optional[str] = Field(default=None, unique=True, index=True)
    phone: str = Field(unique=True, index=True)
    is_active: bool = True
    is_verified: bool = False
    is_admin: bool = False
    verified_level: UserVerifiedLevel = Field(default=UserVerifiedLevel.guest)
    avatar_url: Optional[str] = None
    response_time: Optional[str] = "Typically responds in a few hours"
    email_notifications: bool = True
    sms_notifications: bool = False


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: Optional[str] = Field(default=None)  # Keep optional for backward compat/admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    listings: List["Listing"] = Relationship(back_populates="owner")
    verification_requests: List["VerificationRequest"] = Relationship(back_populates="user")
    wallet: Optional["Wallet"] = Relationship(back_populates="user")


class UserCreate(SQLModel):
    phone: str
    full_name: Optional[str] = None


class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    response_time: Optional[str] = None
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None


class PasswordChange(SQLModel):
    current_password: str
    new_password: str
