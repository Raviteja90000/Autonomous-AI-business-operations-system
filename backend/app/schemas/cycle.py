from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class TicketData(BaseModel):
    subject: str = Field(default="Customer requesting refund")
    amount_usd: float = Field(default=25.0, ge=0.0)
    customer_email: str = Field(default="ravitejatalapaneni@gmail.com")
    charge_id: Optional[str] = Field(default="ch_live_demo_25")
    description: Optional[str] = None


class CycleTriggerRequest(BaseModel):
    domain: str = Field(default="sales", description="Target business domain: sales, finance, support, marketing, operations")
    trigger_type: str = Field(default="MANUAL", description="MANUAL, SCHEDULED, ANOMALY_EVENT, WEBHOOK")
    correlation_id: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    ticket_data: Optional[TicketData] = None


class WorldStateResponse(BaseModel):
    id: str
    cycle_id: str
    domain: str
    state_data: Dict[str, Any]
    aggregate_metrics: Dict[str, Any]
    entity_count: int
    anomaly_count: int
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class CycleResponse(BaseModel):
    id: str
    organization_id: Optional[str] = None
    domain: str
    status: str
    trigger_type: str
    correlation_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    current_stage: str
    stage_progress: Dict[str, Any] = {}
    metadata_json: Dict[str, Any] = {}
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


from backend.app.schemas.decision import DecisionRecordResponse
from backend.app.schemas.action import ActionExecutionResponse
from backend.app.schemas.evaluation import EvaluationReportResponse
from backend.app.schemas.approval import ApprovalRequestResponse


class CycleDetailResponse(CycleResponse):
    world_states: List[WorldStateResponse] = []
    observation_count: int = 0
    decision_count: int = 0
    action_count: int = 0
    decision: Optional[DecisionRecordResponse] = None
    actions: List[ActionExecutionResponse] = []
    evaluation: Optional[EvaluationReportResponse] = None
    approval: Optional[ApprovalRequestResponse] = None
