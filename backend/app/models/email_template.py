"""Email template models for marketing automation."""

from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class EmailTemplateBase(SQLModel):
    """Base email template model."""
    event_type: str = Field(index=True)  # signup, listing_approved, etc.
    name: str  # Display name
    subject: str
    html_content: str
    text_content: Optional[str] = None
    is_active: bool = Field(default=True)
    description: Optional[str] = None
    variables: Optional[str] = None  # JSON list of template variables


class EmailTemplate(EmailTemplateBase, table=True):
    """Email template stored in database."""
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    updated_by: Optional[int] = Field(default=None, foreign_key="user.id")


class EmailTemplateCreate(EmailTemplateBase):
    """Create email template request."""
    pass


class EmailTemplateUpdate(SQLModel):
    """Update email template request."""
    name: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None
    variables: Optional[str] = None


class EmailTemplateRead(EmailTemplateBase):
    """Email template response."""
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None


class EmailTemplatePreview(SQLModel):
    """Email template preview with rendered content."""
    id: int
    event_type: str
    name: str
    subject: str
    html_content: str
    variables: list[str]
