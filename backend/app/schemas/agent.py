from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class AgentRunResponse(BaseModel):
    id: str
    cycle_id: str
    agent_type: str
    model_name: str
    prompt_version: str
    prompt_hash: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    latency_ms: float
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PromptVersionResponse(BaseModel):
    id: str
    prompt_id: str
    version: str
    agent_type: str
    system_prompt: str
    template: str
    approved_by: str
    status: str
    prompt_hash: str
    created_at: datetime

    class Config:
        from_attributes = True


class AgentCardInfo(BaseModel):
    agent_type: str
    name: str
    description: str
    model: str
    prompt_version: str
    status: str  # ACTIVE | IDLE | DISABLED | RUNNING
    success_rate_percentage: float
    average_latency_ms: float
    total_runs: int
    total_cost_usd: float
    permissions: List[str] = []
    forbidden_actions: List[str] = []
