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


class TrustLevel(str, enum.Enum):
    NEW = "NEW"
    VERIFIED = "VERIFIED"
    TRUSTED = "TRUSTED"


class UserBase(SQLModel):
    full_name: Optional[str] = None
    email: str = Field(unique=True, index=True)
    phone: Optional[str] = Field(default=None, unique=True, index=True)
    is_active: bool = True
    is_verified: bool = False
    email_verified: bool = Field(default=False)
    phone_verified: bool = Field(default=False)  # kept for legacy
    is_admin: bool = False
    verified_level: UserVerifiedLevel = Field(default=UserVerifiedLevel.guest)
    avatar_url: Optional[str] = None
    response_time: Optional[str] = "Typically responds in a few hours"
    email_notifications: bool = True
    sms_notifications: bool = False
    is_agent: bool = Field(default=False)
    profile_views: int = Field(default=0)
    referral_code: Optional[str] = Field(default=None, index=True)       # marketing promo code used at signup
    referral_listing_counted: bool = Field(default=False)                 # True after first ad posted
    location: Optional[str] = Field(default=None)                        # city / region set from profile
    
    # Trust & Security Fields
    trust_score: int = Field(default=0)
    trust_level: TrustLevel = Field(default=TrustLevel.NEW)
    is_flagged: bool = Field(default=False)
    is_suspended: bool = Field(default=False)


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
    location: Optional[str] = None


class PasswordChange(SQLModel):
    current_password: str
    new_password: str
