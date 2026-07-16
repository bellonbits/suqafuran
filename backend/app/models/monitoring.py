"""Models for monitoring and alerting system."""

from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column, String, DateTime, func


class AlertRule(SQLModel, table=True):
    """Alert rule for automated monitoring."""

    __tablename__ = "alert_rules"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    metric_type: str = Field(max_length=50)  # notification_failure_rate, kafka_lag, etc.
    condition_type: str = Field(max_length=50)  # greater_than, less_than, between, etc.
    threshold_value: float
    threshold_value_high: Optional[float] = Field(default=None)  # For BETWEEN condition
    severity: str = Field(default="warning", max_length=20)  # info, warning, critical
    alert_message: str = Field(max_length=500)
    is_active: bool = Field(default=True, index=True)
    cooldown_minutes: Optional[int] = Field(default=30)  # Avoid alert spam

    # Metadata
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, server_default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, server_default=func.now(), onupdate=func.now()),
    )
    created_by: Optional[int] = Field(default=None)  # Admin user ID

    def __repr__(self):
        return f"<AlertRule {self.id}: {self.name}>"


class AlertHistory(SQLModel, table=True):
    """History of alert incidents."""

    __tablename__ = "alert_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    alert_rule_id: int = Field(foreign_key="alert_rules.id", index=True)
    triggered: bool = Field(default=False, index=True)
    current_value: Optional[float] = Field(default=None)
    threshold_value: Optional[float] = Field(default=None)
    message: Optional[str] = Field(default=None, max_length=500)
    acknowledged: bool = Field(default=False, index=True)
    acknowledged_at: Optional[datetime] = Field(default=None)
    acknowledged_by: Optional[int] = Field(default=None)  # Admin user ID

    # Metadata
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, server_default=func.now(), index=True),
    )

    def __repr__(self):
        return f"<AlertHistory {self.id}: rule={self.alert_rule_id}, triggered={self.triggered}>"


class NotificationLog(SQLModel, table=True):
    """Log of notification delivery attempts."""

    __tablename__ = "notification_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    notification_id: str = Field(index=True)
    user_id: int = Field(index=True)
    event_type: str = Field(max_length=100)
    channel: str = Field(max_length=50)  # sms, email, push
    provider: str = Field(max_length=50)
    status: str = Field(max_length=50, index=True)  # sent, failed, pending, delivered
    error_message: Optional[str] = Field(default=None)
    correlation_id: Optional[str] = Field(default=None, index=True)
    trace_id: Optional[str] = Field(default=None, index=True)
    delivery_time_ms: Optional[int] = Field(default=None)

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, server_default=func.now(), index=True),
    )
    updated_at: Optional[datetime] = Field(default=None)

    def __repr__(self):
        return f"<NotificationLog {self.id}: {self.status}>"
