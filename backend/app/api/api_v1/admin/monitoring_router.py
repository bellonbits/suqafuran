"""Monitoring dashboard API endpoints for admin operations."""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlmodel import Session
from app.api import deps
from app.services.kafka_admin import get_kafka_admin, TopicMetrics
from app.database import SessionLocal
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/monitoring", tags=["admin-monitoring"])


# ─────────────────────────────────────────────────────────────────────────────
# OVERVIEW ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/overview")
async def get_monitoring_overview(
    db: Session = Depends(deps.get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """Get top-level monitoring overview dashboard data.

    Returns:
    - System health stats (events/sec, notification success rate, etc.)
    - Topic health summary grid
    - Notification funnel mini-chart
    - Recent critical events feed
    """
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        kafka_admin = get_kafka_admin()
        topics = kafka_admin.list_topics()

        # Aggregate Kafka metrics
        total_events_per_sec = 0.0  # Would be computed from time-series data
        total_topics = len(topics)
        lagging_topics = sum(1 for t in topics.values() if t.status == 'lagging')
        stalled_topics = sum(1 for t in topics.values() if t.status == 'stalled')

        # Notification success rate (last 1h)
        from app.models.notification import NotificationLog  # If created
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)

        # notification_success_rate would query the notification_log table
        notification_success_rate = 95.0  # Placeholder

        # Active celery workers (would query Redis)
        active_workers = 12  # Placeholder
        queue_depth = 45  # Placeholder

        # P95 trace latency (would query Jaeger)
        p95_latency_ms = 523  # Placeholder

        # Failed payments (last 1h)
        failed_payments = 0  # Placeholder

        # Open alerts
        open_alerts = 0  # Placeholder

        return {
            "stats": {
                "events_per_sec": total_events_per_sec,
                "notification_success_rate": notification_success_rate,
                "active_workers": active_workers,
                "queue_depth": queue_depth,
                "p95_latency_ms": p95_latency_ms,
                "failed_payments_1h": failed_payments,
                "open_alerts": open_alerts,
            },
            "topic_health": [
                {
                    "name": t.name,
                    "messages_per_sec": t.messages_per_sec,
                    "consumer_lag": t.consumer_lag,
                    "partition_count": t.partition_count,
                    "status": t.status,
                    "last_message_timestamp": t.last_message_timestamp,
                }
                for t in sorted(topics.values(), key=lambda x: x.name)
            ],
            "summary": {
                "total_topics": total_topics,
                "lagging_topics": lagging_topics,
                "stalled_topics": stalled_topics,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error in get_monitoring_overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to get monitoring overview")


# ─────────────────────────────────────────────────────────────────────────────
# KAFKA TOPICS ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/kafka/topics")
async def list_kafka_topics(
    current_user: Any = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """List all Kafka topics with metrics.

    Returns:
    - List of topics with: name, partition_count, total_messages, messages_per_sec,
      consumer_lag, retention_policy, status
    """
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        kafka_admin = get_kafka_admin()
        topics = kafka_admin.list_topics()

        topics_list = [
            {
                "name": t.name,
                "partition_count": t.partition_count,
                "total_messages": t.total_messages,
                "messages_per_sec": t.messages_per_sec,
                "consumer_lag": t.consumer_lag,
                "consumer_groups": t.consumer_groups,
                "retention_bytes": t.retention_bytes,
                "retention_ms": t.retention_ms,
                "status": t.status,
                "last_message_timestamp": t.last_message_timestamp.isoformat() if t.last_message_timestamp else None,
            }
            for t in sorted(topics.values(), key=lambda x: x.name)
        ]

        return {
            "topics": topics_list,
            "total": len(topics_list),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error listing Kafka topics: {e}")
        raise HTTPException(status_code=500, detail="Failed to list Kafka topics")


@router.get("/kafka/topics/{topic_name}")
async def get_kafka_topic_detail(
    topic_name: str,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """Get detailed metrics for a specific Kafka topic.

    Args:
        topic_name: Name of the Kafka topic

    Returns:
    - Topic metrics with partition breakdown
    - Time-series data (last 24h) for throughput and lag
    - Sample of recent messages
    """
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        kafka_admin = get_kafka_admin()
        topic = kafka_admin.get_topic_detail(topic_name)

        if not topic:
            raise HTTPException(status_code=404, detail=f"Topic '{topic_name}' not found")

        partitions = kafka_admin.get_partition_metrics(topic_name)

        return {
            "topic": {
                "name": topic.name,
                "partition_count": topic.partition_count,
                "total_messages": topic.total_messages,
                "messages_per_sec": topic.messages_per_sec,
                "consumer_lag": topic.consumer_lag,
                "status": topic.status,
                "retention_bytes": topic.retention_bytes,
                "retention_ms": topic.retention_ms,
            },
            "partitions": [
                {
                    "id": p.partition,
                    "leader": p.leader,
                    "log_end_offset": p.log_end_offset,
                    "committed_offset": p.committed_offset,
                    "lag": p.lag,
                }
                for p in partitions
            ],
            "time_series": {
                "throughput_1h": [],  # Placeholder: would populate from metrics cache
                "lag_1h": [],  # Placeholder
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting topic detail for {topic_name}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get topic detail")


@router.get("/kafka/topics/{topic_name}/messages")
async def get_kafka_topic_messages(
    topic_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    event_type_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """Get recent messages from a Kafka topic.

    Args:
        topic_name: Name of the topic
        skip: Pagination offset
        limit: Pagination limit (max 500)
        event_type_filter: Filter by event type substring
        status_filter: Filter by 'success' or 'failed'

    Returns:
    - List of recent messages with: event_id, event_type, timestamp, user_id,
      correlation_id, payload preview
    """
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        # Placeholder: Would read from Kafka topic using a consumer
        # configured to read from the earliest offset, then sample last 50 messages
        # and apply filters

        messages = [
            {
                "event_id": f"evt_{i}",
                "event_type": "order.created",
                "timestamp": (datetime.utcnow() - timedelta(seconds=i*10)).isoformat(),
                "user_id": 12345 + i,
                "correlation_id": f"corr_{i}",
                "trace_id": f"trace_{i}",
                "status": "success" if i % 3 != 0 else "failed",
                "payload_preview": {"order_id": 9000 + i, "amount": 500 + i*10},
            }
            for i in range(limit)
        ]

        return {
            "topic": topic_name,
            "messages": messages,
            "total": len(messages),
            "skip": skip,
            "limit": limit,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting messages for topic {topic_name}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get topic messages")


# ─────────────────────────────────────────────────────────────────────────────
# FUTURE ENDPOINTS (stubbed for Phase 2+)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/notifications/funnel")
async def get_notification_funnel(
    current_user: Any = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """Placeholder for Phase 2: Notification funnel data."""
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"status": "not_implemented_yet"}


@router.get("/traces/search")
async def search_traces(
    current_user: Any = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """Placeholder for Phase 3: Trace search."""
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"status": "not_implemented_yet"}


@router.get("/live")
async def get_live_events(
    current_user: Any = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """Placeholder for Phase 4: Live events WebSocket."""
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"status": "not_implemented_yet"}


@router.get("/alerts")
async def list_alerts(
    current_user: Any = Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    """Placeholder for Phase 5: Alert rules."""
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"status": "not_implemented_yet"}
