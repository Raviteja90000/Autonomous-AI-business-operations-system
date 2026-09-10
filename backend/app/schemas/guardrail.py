from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class RuleEvaluationItem(BaseModel):
    rule_name: str
    passed: bool
    details: str
    threshold: Optional[Any] = None
    actual: Optional[Any] = None


class GuardrailEvaluationResponse(BaseModel):
    id: str
    decision_id: str
    cycle_id: str
    action_id: Optional[str] = None
    decision_result: str  # ALLOW, REQUIRE_APPROVAL, BLOCK
    violated_policies: List[str] = []
    evaluated_tier: int
    risk_score: float
    estimated_cost_usd: float
    blast_radius_count: int
    rule_evaluation_trace: List[Dict[str, Any]] = []
    summary_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
