from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Boolean, Float, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import BaseModel


class Integration(BaseModel):
    __tablename__ = "integrations"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    domain: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # sales, finance, support, email, marketing, operations
    connector_type: Mapped[str] = mapped_column(String(50), nullable=False)  # crm, finance, support, email, marketing, operations
    status: Mapped[str] = mapped_column(String(30), default="CONNECTED", nullable=False)  # CONNECTED, DISCONNECTED, DEGRADED
    is_mock: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    last_sync_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_health_check_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    error_rate_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)


class IntegrationCredential(BaseModel):
    __tablename__ = "integration_credentials"

    integration_id: Mapped[str] = mapped_column(String(36), ForeignKey("integrations.id", ondelete="CASCADE"), index=True, nullable=False)
    auth_type: Mapped[str] = mapped_column(String(50), default="api_key", nullable=False)  # api_key, oauth2, basic
    encrypted_secrets: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)  # never exposed to frontend
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
