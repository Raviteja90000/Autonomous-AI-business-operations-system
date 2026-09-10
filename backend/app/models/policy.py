from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import BaseModel


class PolicyVersion(BaseModel):
    __tablename__ = "policy_versions"

    version_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)  # e.g., v1.8.0
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    rules_yaml: Mapped[str] = mapped_column(Text, nullable=False)
    rules_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    effective_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    author: Mapped[str] = mapped_column(String(255), default="admin", nullable=False)
    approved_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class PolicyUpdate(BaseModel):
    __tablename__ = "policy_updates"

    evaluation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("evaluation_reports.id", ondelete="SET NULL"), nullable=True)
    proposed_by_agent: Mapped[str] = mapped_column(String(50), default="adapter", nullable=False)
    proposed_changes: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="PROPOSED", nullable=False)  # PROPOSED, ACCEPTED, REJECTED
