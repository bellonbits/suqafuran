"""Service for monitoring notification delivery and funnel analytics."""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy import func, select, and_
from sqlmodel import Session
from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationMetrics:
    """Calculate notification funnel and delivery metrics."""

    def __init__(self, db: Session):
        self.db = db

    def get_funnel_data(
        self,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        domain: Optional[str] = None,
        channel: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> List[Dict]:
        """Get notification funnel data grouped by event type.

        Returns list of funnel stages showing counts at each step.
        Stages: requested → dispatched → sent → delivered
        """
        if date_from is None:
            date_from = datetime.utcnow() - timedelta(days=1)
        if date_to is None:
            date_to = datetime.utcnow()

        # Query notification_log with filters
        # This is a simplified version - in production would use actual query
        # For now returning structure showing funnel progression

        funnel_data = [
            {
                "event_type": "auth.otp.requested",
                "channel": "sms",
                "stages": [
                    {"name": "Requested", "count": 1000},
                    {"name": "Dispatched", "count": 980},
                    {"name": "Sent", "count": 950},
                    {"name": "Delivered", "count": 925},
                ],
                "success_rate": 92.5,
                "total_sent": 1000,
                "total_failed": 75,
                "avg_delivery_time_ms": 1523,
            },
            {
                "event_type": "auth.signup.success",
                "channel": "email",
                "stages": [
                    {"name": "Requested", "count": 512},
                    {"name": "Dispatched", "count": 510},
                    {"name": "Sent", "count": 508},
                    {"name": "Delivered", "count": 505},
                ],
                "success_rate": 98.6,
                "total_sent": 512,
                "total_failed": 7,
                "avg_delivery_time_ms": 2341,
            },
            {
                "event_type": "payments.mpesa.success",
                "channel": "sms",
                "stages": [
                    {"name": "Requested", "count": 2345},
                    {"name": "Dispatched", "count": 2310},
                    {"name": "Sent", "count": 2280},
                    {"name": "Delivered", "count": 2200},
                ],
                "success_rate": 93.8,
                "total_sent": 2345,
                "total_failed": 145,
                "avg_delivery_time_ms": 891,
            },
        ]

        # Filter results if parameters provided
        if event_type:
            funnel_data = [
                f
                for f in funnel_data
                if event_type.lower() in f["event_type"].lower()
            ]
        if channel:
            funnel_data = [f for f in funnel_data if f["channel"] == channel]

        return funnel_data

    def get_notification_summary(
        self,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        domain: Optional[str] = None,
        channel: Optional[str] = None,
    ) -> List[Dict]:
        """Get summary metrics per event type.

        Returns table data with: event_type, channel, sent, failed, success_rate, avg_time
        """
        if date_from is None:
            date_from = datetime.utcnow() - timedelta(days=1)
        if date_to is None:
            date_to = datetime.utcnow()

        summary = [
            {
                "event_type": "auth.otp.requested",
                "channel": "sms",
                "provider": "africas_talking",
                "sent": 1000,
                "failed": 75,
                "pending": 0,
                "success_rate": 92.5,
                "failure_rate": 7.5,
                "avg_delivery_time_ms": 1523,
                "last_24h_trend": -2.1,  # percentage change
            },
            {
                "event_type": "auth.signup.success",
                "channel": "email",
                "provider": "resend",
                "sent": 512,
                "failed": 7,
                "pending": 0,
                "success_rate": 98.6,
                "failure_rate": 1.4,
                "avg_delivery_time_ms": 2341,
                "last_24h_trend": 1.2,
            },
            {
                "event_type": "payments.mpesa.success",
                "channel": "sms",
                "provider": "africas_talking",
                "sent": 2345,
                "failed": 145,
                "pending": 23,
                "success_rate": 93.8,
                "failure_rate": 6.2,
                "avg_delivery_time_ms": 891,
                "last_24h_trend": -3.4,
            },
            {
                "event_type": "catalog.product.created",
                "channel": "email",
                "provider": "resend",
                "sent": 187,
                "failed": 3,
                "pending": 0,
                "success_rate": 98.4,
                "failure_rate": 1.6,
                "avg_delivery_time_ms": 1802,
                "last_24h_trend": 0.5,
            },
        ]

        # Filter by channel if provided
        if channel:
            summary = [s for s in summary if s["channel"] == channel]

        return summary

    def get_notification_attempts(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        event_type: Optional[str] = None,
        channel: Optional[str] = None,
        user_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> Tuple[List[Dict], int]:
        """Get paginated list of notification delivery attempts.

        Returns individual notification records with delivery status.
        """
        if date_from is None:
            date_from = datetime.utcnow() - timedelta(days=1)
        if date_to is None:
            date_to = datetime.utcnow()

        # Placeholder data - in production would query notification_log table
        attempts = [
            {
                "id": "notif_001",
                "event_id": "evt_12345",
                "event_type": "auth.otp.requested",
                "channel": "sms",
                "provider": "africas_talking",
                "user_id": 1001,
                "phone_number": "+254712345678",
                "status": "delivered",
                "error_message": None,
                "correlation_id": "corr_abc123",
                "trace_id": "trace_xyz789",
                "dispatched_at": datetime.utcnow() - timedelta(minutes=5),
                "delivered_at": datetime.utcnow() - timedelta(minutes=4),
                "delivery_time_ms": 1523,
            },
            {
                "id": "notif_002",
                "event_id": "evt_12346",
                "event_type": "auth.otp.requested",
                "channel": "sms",
                "provider": "africas_talking",
                "user_id": 1002,
                "phone_number": "+254798765432",
                "status": "failed",
                "error_message": "Invalid phone number format",
                "correlation_id": "corr_def456",
                "trace_id": "trace_abc123",
                "dispatched_at": datetime.utcnow() - timedelta(minutes=3),
                "delivered_at": None,
                "delivery_time_ms": None,
            },
            {
                "id": "notif_003",
                "event_id": "evt_12347",
                "event_type": "payments.mpesa.success",
                "channel": "sms",
                "provider": "africas_talking",
                "user_id": 2001,
                "phone_number": "+254722111222",
                "status": "pending",
                "error_message": None,
                "correlation_id": "corr_ghi789",
                "trace_id": "trace_def456",
                "dispatched_at": datetime.utcnow() - timedelta(minutes=1),
                "delivered_at": None,
                "delivery_time_ms": None,
            },
            {
                "id": "notif_004",
                "event_id": "evt_12348",
                "event_type": "auth.signup.success",
                "channel": "email",
                "provider": "resend",
                "user_id": 1050,
                "email": "user@example.com",
                "status": "delivered",
                "error_message": None,
                "correlation_id": "corr_jkl012",
                "trace_id": "trace_ghi789",
                "dispatched_at": datetime.utcnow() - timedelta(hours=1),
                "delivered_at": datetime.utcnow() - timedelta(hours=1, minutes=-1),
                "delivery_time_ms": 2341,
            },
        ]

        # Apply filters
        if status:
            attempts = [a for a in attempts if a["status"] == status]
        if event_type:
            attempts = [
                a for a in attempts if event_type.lower() in a["event_type"].lower()
            ]
        if channel:
            attempts = [a for a in attempts if a["channel"] == channel]
        if user_id:
            attempts = [a for a in attempts if a["user_id"] == user_id]

        total = len(attempts)
        paginated = attempts[skip : skip + limit]

        return paginated, total

    def retry_notification(self, notification_id: str) -> Dict:
        """Retry a failed notification by re-publishing to dispatch queue.

        Returns updated notification status.
        """
        logger.info(f"Retrying notification: {notification_id}")

        # In production, this would:
        # 1. Query notification_log to get original event data
        # 2. Re-publish to notifications.dispatch Kafka topic
        # 3. Update notification_log with retry attempt

        return {
            "status": "ok",
            "notification_id": notification_id,
            "message": "Notification queued for retry",
            "retry_at": datetime.utcnow().isoformat(),
        }
