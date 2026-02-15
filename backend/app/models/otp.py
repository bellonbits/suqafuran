from datetime import datetime, timedelta
from typing import Optional
from sqlmodel import Field, SQLModel
import random
import string

class OTP(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone: str = Field(index=True)
    code: str
    expires_at: datetime
    is_used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @classmethod
    def generate_code(cls, length: int = 6) -> str:
        return "".join(random.choices(string.digits, k=length))

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
