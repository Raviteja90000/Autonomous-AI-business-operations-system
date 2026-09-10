from typing import Optional
from sqlalchemy import String, Float, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import BaseModel


class AgentRun(BaseModel):
    __tablename__ = "agent_runs"

    cycle_id: Mapped[str] = mapped_column(String(36), ForeignKey("odaea_cycles.id", ondelete="CASCADE"), index=True, nullable=False)
    agent_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # observer, aggregator, planner, critic, actuator, evaluator, adapter
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(50), nullable=False)
    prompt_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="SUCCESS", nullable=False)  # RUNNING, SUCCESS, FAILED
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PromptVersion(BaseModel):
    __tablename__ = "prompt_versions"

    prompt_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    agent_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    template: Mapped[str] = mapped_column(Text, nullable=False)
    approved_by: Mapped[str] = mapped_column(String(255), default="admin", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)  # ACTIVE, DEPRECATED
    prompt_hash: Mapped[str] = mapped_column(String(64), nullable=False)
