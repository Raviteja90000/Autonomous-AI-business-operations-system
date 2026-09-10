from datetime import datetime
from typing import List, Dict, Any
from pydantic import BaseModel


class CriticReviewResponse(BaseModel):
    id: str
    decision_id: str
    cycle_id: str
    review_status: str
    reasoning_critique: str
    risk_assessment: str
    logic_score: float
    hallucination_risk: float
    recommendations: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True
