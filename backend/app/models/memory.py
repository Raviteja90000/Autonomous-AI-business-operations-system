from typing import Optional
from sqlalchemy import String, Float, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import BaseModel


class MemoryEpisode(BaseModel):
    __tablename__ = "memory_episodes"

    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    cycle_id: Mapped[Optional[str]] = mapped_column(String(36), index=True, nullable=True)
    episode_summary: Mapped[str] = mapped_column(Text, nullable=False)
    goal: Mapped[str] = mapped_column(String(255), nullable=False)
    actions_taken: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)
    outcome: Mapped[str] = mapped_column(String(30), default="POSITIVE", nullable=False)  # POSITIVE, NEUTRAL, NEGATIVE
    reward_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    importance: Mapped[float] = mapped_column(Float, default=0.8, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    provenance: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class MemoryDocument(BaseModel):
    __tablename__ = "memory_documents"

    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50), default="standard_operating_procedure", nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)


class MemoryEmbedding(BaseModel):
    __tablename__ = "memory_embeddings"

    document_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("memory_documents.id", ondelete="CASCADE"), nullable=True)
    episode_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("memory_episodes.id", ondelete="CASCADE"), nullable=True)
    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    text_snippet: Mapped[str] = mapped_column(Text, nullable=False)
    embedding_vector: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)  # normalized float array for vector search
