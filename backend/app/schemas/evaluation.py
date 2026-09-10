from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class EvaluationReportResponse(BaseModel):
    id: str
    cycle_id: str
    action_execution_id: Optional[str] = None
    domain: str
    before_metrics: Optional[Dict[str, Any]] = None
    after_metrics: Optional[Dict[str, Any]] = None
    metric_deltas: Optional[Dict[str, Any]] = None
    expected_effect: Optional[Dict[str, Any]] = None
    actual_outcome: str
    goal_achieved: bool
    confidence_score: float
    adaptation_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
