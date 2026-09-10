from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class ObservationEntityResponse(BaseModel):
    id: str
    snapshot_id: str
    domain: str
    entity_type: str
    entity_id: str
    attributes: Dict[str, Any]
    risk_indicator: float

    class Config:
        from_attributes = True


class ObservationAnomalyResponse(BaseModel):
    id: str
    snapshot_id: Optional[str] = None
    cycle_id: Optional[str] = None
    domain: str
    entity_id: str
    severity: str
    description: str
    confidence: float
    recommended_action: str
    is_resolved: bool
    detected_at: datetime

    class Config:
        from_attributes = True


class ObservationSnapshotResponse(BaseModel):
    id: str
    cycle_id: str
    domain: str
    source_system: str
    raw_data_summary: str
    payload: Dict[str, Any]
    status: str
    detected_at: datetime
    entities: List[ObservationEntityResponse] = []
    anomalies: List[ObservationAnomalyResponse] = []

    class Config:
        from_attributes = True
