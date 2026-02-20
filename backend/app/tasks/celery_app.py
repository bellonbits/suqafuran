from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "suqafuran",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.notification_tasks",
        "app.tasks.promotion_tasks",
        "app.tasks.email_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,
    task_acks_late=True,          # Only ack after task completes (safer)
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1, # Don't prefetch — fair distribution
    task_routes={
        "app.tasks.promotion_tasks.*": {"queue": "promotions"},
        "app.tasks.notification_tasks.*": {"queue": "notifications"},
        "app.tasks.email_tasks.*": {"queue": "default"},
    },
    beat_schedule={
        # Expire stale promotions that never got paid — every hour
        "expire-stale-promotions": {
            "task": "app.tasks.promotion_tasks.expire_stale_promotions",
            "schedule": 3600.0,
        },
        # Retry failed STK pushes — every 5 minutes
        "retry-failed-stk-pushes": {
            "task": "app.tasks.promotion_tasks.retry_failed_stk_pushes",
            "schedule": 300.0,
        },
    },
)
