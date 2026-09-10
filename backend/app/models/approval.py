from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, DateTime, Float, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import BaseModel


class ApprovalRequest(BaseModel):
    __tablename__ = "approval_requests"

    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decision_records.id", ondelete="CASCADE"), index=True, nullable=False)
    cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("odaea_cycles.id", ondelete="CASCADE"), index=True, nullable=False)
    action_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    requested_by_agent: Mapped[str] = mapped_column(String(50), default="planner", nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    blast_radius_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="PENDING", index=True, nullable=False)  # PENDING, APPROVED, REJECTED, CHANGES_REQUESTED, EXPIRED
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    events: Mapped[List["ApprovalEvent"]] = relationship("ApprovalEvent", back_populates="request", cascade="all, delete-orphan", lazy="selectin")


class ApprovalEvent(BaseModel):
    __tablename__ = "approval_events"

    approval_request_id: Mapped[str] = mapped_column(String(36), ForeignKey("approval_requests.id", ondelete="CASCADE"), index=True, nullable=False)
    reviewer_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(30), nullable=False)  # APPROVE, REJECT, REQUEST_CHANGES
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    request: Mapped["ApprovalRequest"] = relationship("ApprovalRequest", back_populates="events")
