from typing import Optional
from sqlalchemy import String, Float, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import BaseModel


class EvaluationReport(BaseModel):
    __tablename__ = "evaluation_reports"

    cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("odaea_cycles.id", ondelete="CASCADE"), index=True, nullable=False)
    action_execution_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("action_executions.id", ondelete="SET NULL"), nullable=True)
    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    before_metrics: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    after_metrics: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    metric_deltas: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    expected_effect: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    actual_outcome: Mapped[str] = mapped_column(String(30), default="POSITIVE", nullable=False)  # POSITIVE, NEUTRAL, NEGATIVE
    goal_achieved: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    adaptation_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
