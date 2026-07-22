from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, JSON


class SubcategoryBase(SQLModel):
    category_id: int = Field(foreign_key="category.id", index=True)
    name_en: str
    name_so: Optional[str] = None
    slug: str = Field(unique=True, index=True)
    icon_name: Optional[str] = None
    image_url: Optional[str] = None
    attributes_schema: dict = Field(default={}, sa_column=Column(JSON))


class Subcategory(SubcategoryBase, table=True):
    __tablename__ = "subcategory"
    id: Optional[int] = Field(default=None, primary_key=True)
    status: str = Field(default="active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SubcategoryCreate(SubcategoryBase):
    pass


class SubcategoryUpdate(SQLModel):
    name_en: Optional[str] = None
    name_so: Optional[str] = None
    slug: Optional[str] = None
    icon_name: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None


class SubcategoryRead(Subcategory):
    pass
