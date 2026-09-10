from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class DecisionActionResponse(BaseModel):
    id: str
    decision_id: str
    action_type: str
    target_system: str
    payload: Dict[str, Any]
    estimated_cost_usd: float
    risk_score: float
    blast_radius: int
    is_reversible: bool
    sequence_order: int

    class Config:
        from_attributes = True


class DecisionEvidenceResponse(BaseModel):
    id: str
    decision_id: str
    source_type: str
    reference_id: str
    snippet: str
    confidence_contribution: float

    class Config:
        from_attributes = True


class DecisionRecordResponse(BaseModel):
    id: str
    cycle_id: str
    domain: str
    goal: str
    rationale_summary: str
    confidence: float
    estimated_cost_usd: float
    risk_level: str
    blast_radius_count: int
    reversibility: str
    status: str
    critic_approved: Optional[bool] = None
    guardrail_status: Optional[str] = None
    actions: List[DecisionActionResponse] = []
    evidence: List[DecisionEvidenceResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
