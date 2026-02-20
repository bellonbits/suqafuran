"""Email background tasks."""
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task(name="app.tasks.email_tasks.send_verification_email", bind=True, max_retries=2)
def send_verification_email_task(self, email: str, code: str):
    from app.utils.email import send_verification_email
    try:
        send_verification_email(email, code)
        logger.info(f"Verification email sent to {email}")
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


@shared_task(name="app.tasks.email_tasks.send_password_reset", bind=True, max_retries=2)
def send_password_reset_task(self, email: str, code: str):
    from app.utils.email import send_reset_password_email
    try:
        send_reset_password_email(email, code)
        logger.info(f"Password reset email sent to {email}")
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)
