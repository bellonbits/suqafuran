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
    subcategory_id: Optional[int] = Field(default=None, foreign_key="subcategory.id")
    subsubcategory_id: Optional[int] = Field(default=None, foreign_key="subsubcategory.id")
    status: str = Field(default="pending")  # pending, active, closed, reported
    boost_level: int = Field(default=0)  # 0: none, 1: basic, 2: vip, 3: diamond
    boost_expires_at: Optional[datetime] = None
    currency: str = Field(default="USD")
    images: List[str] = Field(default=[], sa_column=Column(JSON))
    attributes: dict = Field(default={}, sa_column=Column(JSON))
    views: int = Field(default=0)
    leads: int = Field(default=0)


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
    image_url: Optional[str] = None
    attributes_schema: dict = Field(default={}, sa_column=Column(JSON))

    subcategories: List["SubCategory"] = Relationship(back_populates="category", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class SubCategory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    slug: str = Field(index=True)
    image_url: Optional[str] = None
    category_id: int = Field(foreign_key="category.id")
    attributes_schema: dict = Field(default={}, sa_column=Column(JSON))

    category: Optional[Category] = Relationship(back_populates="subcategories")
    subsubcategories: List["SubSubCategory"] = Relationship(back_populates="subcategory", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class SubSubCategory(SQLModel, table=True):
    __tablename__ = "subsubcategory"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    slug: str = Field(index=True)
    image_url: Optional[str] = None
    subcategory_id: int = Field(foreign_key="subcategory.id")

    subcategory: Optional[SubCategory] = Relationship(back_populates="subsubcategories")

