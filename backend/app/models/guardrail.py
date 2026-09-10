from typing import Optional
from sqlalchemy import String, Float, Integer, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import BaseModel


class GuardrailEvaluation(BaseModel):
    __tablename__ = "guardrail_evaluations"

    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decision_records.id", ondelete="CASCADE"), index=True, nullable=False)
    cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("odaea_cycles.id", ondelete="CASCADE"), index=True, nullable=False)
    action_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    decision_result: Mapped[str] = mapped_column(String(30), nullable=False)  # ALLOW, REQUIRE_APPROVAL, BLOCK
    violated_policies: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)
    evaluated_tier: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, default=0.1, nullable=False)
    estimated_cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    blast_radius_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    rule_evaluation_trace: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)
    summary_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
