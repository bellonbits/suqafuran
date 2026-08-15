"""Best-effort account-security email alerts triggered from real request handlers."""

import datetime
from fastapi import Request, BackgroundTasks
from sqlmodel import Session
from app.models.user import User


def notify_if_new_device(db: Session, user: User, request: Request, background_tasks: BackgroundTasks) -> None:
    """Alert the user when a login's IP differs from the last one we saw for
    their account (User.last_ip, first set at signup). This isn't true device
    fingerprinting -- there's no session/device table wired to login -- but it
    catches sign-ins from an unfamiliar network without new infrastructure.
    """
    if not user.email or user.email.endswith("@suqafuran.local"):
        return

    ip = request.client.host if request.client else None
    if not ip:
        return

    previous_ip = user.last_ip
    if previous_ip and previous_ip != ip:
        from app.services.email_service import email_service

        user_agent = request.headers.get("user-agent", "Unknown device")
        timestamp = datetime.datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")
        background_tasks.add_task(
            email_service.send_new_device_login_alert,
            user.email, user.full_name or "Customer", user_agent, ip, timestamp, ip, user.id
        )

    if previous_ip != ip:
        user.last_ip = ip
        db.add(user)
        db.commit()
