from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, DateTime, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import BaseModel


class ActionExecution(BaseModel):
    __tablename__ = "action_executions"

    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decision_records.id", ondelete="CASCADE"), index=True, nullable=False)
    cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("odaea_cycles.id", ondelete="CASCADE"), index=True, nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    target_system: Mapped[str] = mapped_column(String(50), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    payload_summary: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING",
        index=True,
        nullable=False
    )  # PENDING, RUNNING, COMPLETED, FAILED, ROLLED_BACK
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    result_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    side_effects: Mapped[List["ActionSideEffect"]] = relationship("ActionSideEffect", back_populates="action_execution", cascade="all, delete-orphan", lazy="selectin")
    rollback_records: Mapped[List["RollbackRecord"]] = relationship("RollbackRecord", back_populates="action_execution", cascade="all, delete-orphan", lazy="selectin")


class ActionSideEffect(BaseModel):
    __tablename__ = "action_side_effects"

    action_execution_id: Mapped[str] = mapped_column(String(36), ForeignKey("action_executions.id", ondelete="CASCADE"), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    before_state: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    after_state: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    action_execution: Mapped["ActionExecution"] = relationship("ActionExecution", back_populates="side_effects")


class RollbackRecord(BaseModel):
    __tablename__ = "rollback_records"

    action_execution_id: Mapped[str] = mapped_column(String(36), ForeignKey("action_executions.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False)  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    initiated_by: Mapped[str] = mapped_column(String(255), nullable=False)
    initiated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rollback_payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    action_execution: Mapped["ActionExecution"] = relationship("ActionExecution", back_populates="rollback_records")


class IdempotencyKey(BaseModel):
    __tablename__ = "idempotency_keys"

    key: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    action_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False)  # PENDING, COMPLETED, FAILED
    response_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
