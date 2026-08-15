"""Admin endpoint for sending a marketing email to every user on the platform."""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from app.api import deps
from app.models.user import User
from app.models.marketing import EmailPreference
from app.core.logging_config import get_logger

logger = get_logger("admin_marketing_broadcast")

router = APIRouter()


class BroadcastRequest(BaseModel):
    subject: str
    html_content: str
    campaign_id: Optional[str] = None
    dry_run: bool = False  # If True, only returns the recipient count -- doesn't send


class BroadcastResponse(BaseModel):
    status: str
    campaign_id: str
    recipient_count: int
    opted_out_count: int


def _check_admin_permission(current_user: User):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can send platform-wide marketing emails",
        )


@router.post("/broadcast", response_model=BroadcastResponse)
def broadcast_marketing_email(
    payload: BroadcastRequest,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Send a marketing email (e.g. a flash-sale campaign) to every user who
    hasn't opted out of promotional emails. Runs as a background Celery
    task -- this endpoint returns immediately with the recipient count,
    it does not wait for the send to finish.
    """
    _check_admin_permission(current_user)

    if not payload.subject.strip():
        raise HTTPException(status_code=400, detail="Subject cannot be empty")
    if not payload.html_content.strip():
        raise HTTPException(status_code=400, detail="Email content cannot be empty")

    opted_out_count = len(
        db.exec(
            select(EmailPreference.user_id).where(EmailPreference.promotional_emails == False)  # noqa: E712
        ).all()
    )
    total_users = len(
        db.exec(select(User.id).where(User.email != None, User.email != "")).all()  # noqa: E711
    )
    recipient_count = total_users - opted_out_count

    import uuid
    campaign_id = payload.campaign_id or f"broadcast_{uuid.uuid4().hex[:10]}"

    if payload.dry_run:
        return BroadcastResponse(
            status="dry_run",
            campaign_id=campaign_id,
            recipient_count=recipient_count,
            opted_out_count=opted_out_count,
        )

    from app.tasks.email_tasks import send_marketing_broadcast
    send_marketing_broadcast.delay(payload.subject, payload.html_content, campaign_id)

    logger.info(
        f"Marketing broadcast queued by admin {current_user.id}: "
        f"campaign_id={campaign_id}, recipients~={recipient_count}"
    )

    return BroadcastResponse(
        status="queued",
        campaign_id=campaign_id,
        recipient_count=recipient_count,
        opted_out_count=opted_out_count,
    )
