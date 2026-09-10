from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ActionRollbackRequest(BaseModel):
    reason: str = Field(..., min_length=3)


class ActionSideEffectResponse(BaseModel):
    id: str
    action_execution_id: str
    entity_type: str
    entity_id: str
    before_state: Dict[str, Any]
    after_state: Dict[str, Any]

    class Config:
        from_attributes = True


class RollbackRecordResponse(BaseModel):
    id: str
    action_execution_id: str
    status: str
    initiated_by: str
    initiated_at: datetime
    completed_at: Optional[datetime] = None
    rollback_payload: Dict[str, Any] = {}
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class ActionExecutionResponse(BaseModel):
    id: str
    decision_id: str
    cycle_id: str
    action_type: str
    target_system: str
    idempotency_key: str
    payload_summary: Dict[str, Any]
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    result_data: Dict[str, Any] = {}
    error_message: Optional[str] = None
    side_effects: List[ActionSideEffectResponse] = []
    rollback_records: List[RollbackRecordResponse] = []

    class Config:
        from_attributes = True
