"""Bulk operations models for product management."""

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class ProductTitleChange(SQLModel, table=True):
    """Track product title changes for audit trail."""

    __tablename__ = "product_title_changes"

    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: str = Field(foreign_key="listing.id", index=True)
    old_title: str
    new_title: str
    changed_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    changed_by: Optional[int] = Field(default=None, foreign_key="user.id")

    class Config:
        table_args = (
            {"comment": "Audit trail for bulk product title changes"},
        )
