"""
Notification + email background tasks (offloaded from API thread).
"""
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task(
    name="app.tasks.notification_tasks.send_otp",
    bind=True,
    max_retries=2,
    queue="notifications",
)
def send_otp(self, phone: str):
    """Send OTP via Africa's Talking (async)."""
    from app.services.africastalking_service import africastalking_service
    try:
        success = africastalking_service.send_verification_code(phone)
        if not success:
            raise Exception("Africa's Talking returned failure")
        logger.info(f"OTP sent to {phone}")
        return {"success": True}
    except Exception as exc:
        logger.warning(f"OTP send failed for {phone}: {exc}")
        raise self.retry(exc=exc, countdown=10)
