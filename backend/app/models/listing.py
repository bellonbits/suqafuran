from datetime import datetime
from typing import Optional, List, Any
from sqlmodel import Field, SQLModel, Relationship


from sqlalchemy import Column, JSON
from typing import TYPE_CHECKING
from app.models.common import OwnerRead
if TYPE_CHECKING:
    from app.models.user import User


class ListingBase(SQLModel):
    title: str = Field(index=True)
    description: str
    price: float
    location: str
    condition: str  # New, Used, Refurbished
    category_id: int = Field(foreign_key="category.id")
    status: str = Field(default="pending")  # pending, active, closed, reported
    boost_level: int = Field(default=0)  # 0: none, 1: basic, 2: vip, 3: diamond
    boost_expires_at: Optional[datetime] = None
    currency: str = Field(default="USD")
    images: List[str] = Field(default=[], sa_column=Column(JSON))
    attributes: dict = Field(default={}, sa_column=Column(JSON))


class Listing(ListingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    owner: Optional["User"] = Relationship(back_populates="listings")


class ListingRead(ListingBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    owner: Optional[OwnerRead] = None


class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    slug: str = Field(unique=True)
    icon_name: str
    attributes_schema: dict = Field(default={}, sa_column=Column(JSON))
