from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class UserDeviceLink(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    device_id: int = Field(foreign_key="device.id", primary_key=True)
    last_used_at: datetime = Field(default_factory=datetime.utcnow)

class Device(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fingerprint: str = Field(unique=True, index=True)
    browser: Optional[str] = None
    os: Optional[str] = None
    screen_resolution: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    gpu_info: Optional[str] = None
    ip_behavior_score: int = Field(default=0) # Calculated risk from IP history
    is_banned: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    # users: List["User"] = Relationship(back_populates="devices", link_model=UserDeviceLink)
