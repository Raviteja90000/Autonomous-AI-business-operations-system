from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, DateTime, Float, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import BaseModel


class ObservationSnapshot(BaseModel):
    __tablename__ = "observation_snapshots"

    cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("odaea_cycles.id", ondelete="CASCADE"), index=True, nullable=False)
    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    source_system: Mapped[str] = mapped_column(String(100), nullable=False)  # hubspot, stripe, zendesk, sendgrid, internal
    raw_data_summary: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="COMPLETED", nullable=False)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    entities: Mapped[List["ObservationEntity"]] = relationship("ObservationEntity", back_populates="snapshot", cascade="all, delete-orphan", lazy="selectin")
    anomalies: Mapped[List["ObservationAnomaly"]] = relationship("ObservationAnomaly", back_populates="snapshot", cascade="all, delete-orphan", lazy="selectin")


class ObservationEntity(BaseModel):
    __tablename__ = "observation_entities"

    snapshot_id: Mapped[str] = mapped_column(String(36), ForeignKey("observation_snapshots.id", ondelete="CASCADE"), index=True, nullable=False)
    domain: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # lead, customer, invoice, ticket, campaign, server
    entity_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    attributes: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    risk_indicator: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    snapshot: Mapped["ObservationSnapshot"] = relationship("ObservationSnapshot", back_populates="entities")


class ObservationAnomaly(BaseModel):
    __tablename__ = "observation_anomalies"

    snapshot_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("observation_snapshots.id", ondelete="SET NULL"), nullable=True)
    cycle_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("odaea_cycles.id", ondelete="CASCADE"), index=True, nullable=True)
    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    description: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    recommended_action: Mapped[str] = mapped_column(String(255), nullable=False)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    snapshot: Mapped[Optional["ObservationSnapshot"]] = relationship("ObservationSnapshot", back_populates="anomalies")
