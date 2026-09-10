from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, DateTime, Integer, Float, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import BaseModel


class ODAEACycle(BaseModel):
    __tablename__ = "odaea_cycles"

    organization_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # sales, finance, support, marketing, operations
    status: Mapped[str] = mapped_column(
        String(50),
        index=True,
        default="PENDING",
        nullable=False
    )  # PENDING, OBSERVING, DECIDING, CRITIQUING, GUARDRAIL_CHECK, AWAITING_APPROVAL, ACTING, EVALUATING, ADAPTING, COMPLETED, FAILED, CANCELLED
    trigger_type: Mapped[str] = mapped_column(String(50), default="MANUAL", nullable=False)  # MANUAL, SCHEDULED, ANOMALY_EVENT, WEBHOOK
    correlation_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    current_stage: Mapped[str] = mapped_column(String(50), default="OBSERVE", nullable=False)
    stage_progress: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    world_states: Mapped[List["WorldState"]] = relationship("WorldState", back_populates="cycle", cascade="all, delete-orphan", lazy="selectin")


class WorldState(BaseModel):
    __tablename__ = "world_states"

    cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("odaea_cycles.id", ondelete="CASCADE"), index=True, nullable=False)
    domain: Mapped[str] = mapped_column(String(50), nullable=False)
    state_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    aggregate_metrics: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    entity_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    anomaly_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    cycle: Mapped["ODAEACycle"] = relationship("ODAEACycle", back_populates="world_states")
