from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class PolicyUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rules_yaml: Optional[str] = None
    rules_json: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class DecidePolicyUpdateRequest(BaseModel):
    action: str  # ACCEPT, REJECT, DISMISS
    notes: Optional[str] = None



class PolicyUpdateResponse(BaseModel):
    id: str
    evaluation_id: Optional[str] = None
    proposed_by_agent: str
    proposed_changes: Dict[str, Any]
    rationale: str
    status: str
    created_at: datetime
    occurrence_count: int = 1

    class Config:
        from_attributes = True


class PolicyVersionResponse(BaseModel):
    id: str
    version_number: str
    name: str
    description: str
    rules_yaml: str
    rules_json: Dict[str, Any]
    is_active: bool
    effective_date: datetime
    author: str
    approved_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
