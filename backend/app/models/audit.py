from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Boolean, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import BaseModel


class AuditEvent(BaseModel):
    __tablename__ = "audit_events"

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    actor_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    actor_type: Mapped[str] = mapped_column(String(20), nullable=False)  # USER, AGENT, SYSTEM
    actor_email: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False)
    result: Mapped[str] = mapped_column(String(30), nullable=False)  # SUCCESS, FAILED, BLOCKED
    risk_level: Mapped[str] = mapped_column(String(20), default="LOW", nullable=False)
    trace_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    request_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class SystemEvent(BaseModel):
    __tablename__ = "system_events"

    event_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)  # INFO, WARNING, ERROR, CRITICAL
    message: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id: Mapped[Optional[str]] = mapped_column(String(36), index=True, nullable=True)
    organization_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # APPROVAL_REQUIRED, ANOMALY_DETECTED, ACTION_FAILED, GUARDRAIL_BLOCKED, SYSTEM_DEGRADED
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    link_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
