from typing import Optional, List
from sqlalchemy import String, Float, Integer, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import BaseModel


class DecisionRecord(BaseModel):
    __tablename__ = "decision_records"

    cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("odaea_cycles.id", ondelete="CASCADE"), index=True, nullable=False)
    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    goal: Mapped[str] = mapped_column(String(255), nullable=False)
    rationale_summary: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    estimated_cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    blast_radius_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    reversibility: Mapped[str] = mapped_column(String(30), default="REVERSIBLE", nullable=False)  # REVERSIBLE, IRREVERSIBLE, PARTIALLY_REVERSIBLE
    status: Mapped[str] = mapped_column(String(30), default="PROPOSED", nullable=False)  # PROPOSED, CRITIQUED, APPROVED, REJECTED, EXECUTED, BLOCKED
    critic_approved: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    guardrail_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # ALLOW, REQUIRE_APPROVAL, BLOCK

    actions: Mapped[List["DecisionAction"]] = relationship("DecisionAction", back_populates="decision", cascade="all, delete-orphan", lazy="selectin")
    evidence: Mapped[List["DecisionEvidence"]] = relationship("DecisionEvidence", back_populates="decision", cascade="all, delete-orphan", lazy="selectin")


class DecisionAction(BaseModel):
    __tablename__ = "decision_actions"

    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decision_records.id", ondelete="CASCADE"), index=True, nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., send_followup_email, apply_credit_note, pause_campaign
    target_system: Mapped[str] = mapped_column(String(50), nullable=False)  # crm, finance, support, email, marketing, operations
    payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    estimated_cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, default=0.1, nullable=False)
    blast_radius: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_reversible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sequence_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    decision: Mapped["DecisionRecord"] = relationship("DecisionRecord", back_populates="actions")


class DecisionEvidence(BaseModel):
    __tablename__ = "decision_evidence"

    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decision_records.id", ondelete="CASCADE"), index=True, nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)  # observation, anomaly, historical_episode, policy
    reference_id: Mapped[str] = mapped_column(String(100), nullable=False)
    snippet: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_contribution: Mapped[float] = mapped_column(Float, default=0.8, nullable=False)

    decision: Mapped["DecisionRecord"] = relationship("DecisionRecord", back_populates="evidence")
