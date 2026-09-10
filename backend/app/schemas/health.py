from typing import Dict, Any, List
from pydantic import BaseModel


class ComponentHealth(BaseModel):
    name: str
    status: str  # HEALTHY | DEGRADED | UNAVAILABLE
    latency_ms: float
    message: str
    details: Dict[str, Any] = {}


class HealthResponse(BaseModel):
    status: str  # HEALTHY | DEGRADED | UNAVAILABLE
    app_name: str
    version: str
    environment: str
    uptime_seconds: float
    components: List[ComponentHealth] = []
