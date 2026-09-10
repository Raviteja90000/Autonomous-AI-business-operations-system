from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class IntegrationResponse(BaseModel):
    id: str
    name: str
    domain: str
    connector_type: str
    status: str  # CONNECTED, DISCONNECTED, DEGRADED
    is_mock: bool
    config: Dict[str, Any] = {}
    last_sync_at: datetime
    last_health_check_at: datetime
    error_rate_percentage: float
    created_at: datetime

    class Config:
        from_attributes = True


class IntegrationTestRequest(BaseModel):
    integration_id: str


class IntegrationTestResponse(BaseModel):
    integration_id: str
    status: str
    success: bool
    latency_ms: float
    message: str
    details: Dict[str, Any] = {}
