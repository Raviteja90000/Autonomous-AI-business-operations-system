from sqlalchemy import String, Float, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import BaseModel


class CriticReview(BaseModel):
    __tablename__ = "critic_reviews"

    decision_id: Mapped[str] = mapped_column(String(36), ForeignKey("decision_records.id", ondelete="CASCADE"), index=True, nullable=False)
    cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("odaea_cycles.id", ondelete="CASCADE"), index=True, nullable=False)
    review_status: Mapped[str] = mapped_column(String(30), nullable=False)  # APPROVED, CONCERNS_RAISED, REJECTED
    reasoning_critique: Mapped[str] = mapped_column(Text, nullable=False)
    risk_assessment: Mapped[str] = mapped_column(Text, nullable=False)
    logic_score: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    hallucination_risk: Mapped[float] = mapped_column(Float, default=0.05, nullable=False)
    recommendations: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)
