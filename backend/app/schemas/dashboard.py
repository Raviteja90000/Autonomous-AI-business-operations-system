from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.app.schemas.cycle import CycleResponse
from backend.app.schemas.observation import ObservationAnomalyResponse
from backend.app.schemas.approval import ApprovalRequestResponse
from backend.app.schemas.action import ActionExecutionResponse
from backend.app.schemas.audit import AuditEventResponse


class KpiMetric(BaseModel):
    title: str
    value: str
    numeric_value: float
    change_percentage: float
    time_range: str
    status: str  # positive, neutral, warning, critical
    sparkline: List[float] = []


class DomainHealthItem(BaseModel):
    domain: str
    health_score: float
    status: str
    active_anomalies: int
    pending_approvals: int
    autonomy_tier: int
    success_rate: float


class DashboardKpisResponse(BaseModel):
    business_health: KpiMetric
    active_cycles: KpiMetric
    autonomous_actions: KpiMetric
    pending_approvals: KpiMetric
    success_rate: KpiMetric
    guardrail_blocks: KpiMetric


class DashboardOverviewResponse(BaseModel):
    kpis: DashboardKpisResponse
    current_autonomy_tier: int
    global_kill_switch: bool
    domain_health: List[DomainHealthItem] = []
    recent_cycles: List[CycleResponse] = []
    active_anomalies: List[ObservationAnomalyResponse] = []
    pending_approvals: List[ApprovalRequestResponse] = []
    recent_actions: List[ActionExecutionResponse] = []
    live_activity: List[AuditEventResponse] = []


class ExecutiveFinancials(BaseModel):
    total_net_value: float
    labor_hours_saved: float
    labor_cost_saved: float
    revenue_loss_prevented: float
    ai_compute_cost: float
    roi_multiplier: float
    hourly_rate_used: float
    human_sla_avg_minutes: float
    autonomous_sla_avg_seconds: float
    mttr_speedup_percent: float


class DepartmentValue(BaseModel):
    domain: str
    actions_count: int
    value_generated: float
    incidents_prevented: int
    top_mitigation: str
    health_score: float
    hours_saved: float


class ModelArbitrageItem(BaseModel):
    provider: str
    tokens_processed: int
    cost_actual: float
    cost_if_frontier: float
    savings_dollars: float
    savings_percentage: float


class ExecutiveReportResponse(BaseModel):
    generated_at: str
    reporting_period: str
    financials: ExecutiveFinancials
    departments: List[DepartmentValue]
    model_arbitrage: List[ModelArbitrageItem]
    governance_score: float
    guardrail_blocks_count: int
    zero_hallucination_adherence: float
    audit_events_count: int
    executive_narrative: str
    strategic_recommendations: List[str]
    audit_hash: str

