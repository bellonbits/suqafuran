from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class TimestampModel(SQLModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class OwnerRead(SQLModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    is_verified: bool = False
    avatar_url: Optional[str] = None
    response_time: Optional[str] = None
