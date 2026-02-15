import enum
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class PromotionStatus(str, enum.Enum):
    PENDING = "pending"
    SUBMITTED = "submitted" # Payment proof submitted
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

class PromotionPlan(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str # e.g., "Basic Boost", "VIP", "Diamond"
    price_usd: float
    duration_days: int
    description: Optional[str] = None

class Promotion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: int = Field(foreign_key="listing.id")
    plan_id: int = Field(foreign_key="promotionplan.id")
    status: PromotionStatus = Field(default=PromotionStatus.PENDING)
    payment_proof: Optional[str] = None # Transaction ID or screenshot URL
    admin_notes: Optional[str] = None
    promotion_code: Optional[str] = Field(default=None, unique=True, index=True)
    approved_by: Optional[int] = Field(default=None, foreign_key="user.id")
    approved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
