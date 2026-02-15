from typing import Optional
from sqlmodel import SQLModel


class OwnerRead(SQLModel):
    full_name: str
    phone: Optional[str] = None
    is_verified: bool = False
    avatar_url: Optional[str] = None
    response_time: Optional[str] = None
