from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ApprovalDecisionRequest(BaseModel):
    action: str = Field(..., description="APPROVE | REJECT | REQUEST_CHANGES")
    notes: Optional[str] = None


class ApprovalEventResponse(BaseModel):
    id: str
    approval_request_id: str
    reviewer_id: Optional[str] = None
    reviewer_email: str
    action: str
    notes: Optional[str] = None
    decided_at: datetime

    class Config:
        from_attributes = True


class ApprovalRequestResponse(BaseModel):
    id: str
    decision_id: str
    cycle_id: str
    action_id: Optional[str] = None
    domain: str
    requested_by_agent: str
    risk_level: str
    cost_usd: float
    blast_radius_count: int
    summary: str
    status: str
    expires_at: Optional[datetime] = None
    created_at: datetime
    events: List[ApprovalEventResponse] = []

    class Config:
        from_attributes = True
