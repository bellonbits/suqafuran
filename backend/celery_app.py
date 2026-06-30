"""
Celery configuration for async task processing
Handles email, SMS, and push notifications asynchronously
"""
from celery import Celery
from core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Celery app
celery_app = Celery(
    "suqafuran",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    result_expires=3600,  # Results expire after 1 hour
    task_default_retry_delay=60,  # Retry after 60 seconds
    task_max_retries=3,
)

# Configure task routes
celery_app.conf.task_routes = {
    "services.notification_service.send_notification_async": {
        "queue": "notifications",
        "routing_key": "notification.send",
    },
}

# Configure queues
celery_app.conf.task_queues = (
    {
        "name": "notifications",
        "exchange": "notifications",
        "routing_key": "notification.*",
        "queue_arguments": {
            "x-message-ttl": 3600000,  # 1 hour TTL
        },
    },
)
