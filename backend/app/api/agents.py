from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.agent import AgentRun, PromptVersion
from backend.app.schemas.agent import AgentRunResponse, PromptVersionResponse, AgentCardInfo
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User

router = APIRouter(prefix="/agents", tags=["Agents & Models"])


@router.get("/cards", response_model=List[AgentCardInfo])
async def list_agent_cards(
    current_user: User = Depends(require_permission("agent.read"))
):
    """Returns overview card data for all six ODAEA agents."""
    return [
        AgentCardInfo(
            agent_type="observer",
            name="Domain Observer",
            description="Continuously ingests signals from CRM, billing, and support systems to detect operational anomalies.",
            model="mock-fast-v1 (Lightweight)",
            prompt_version="1.0.0",
            status="ACTIVE",
            success_rate_percentage=99.2,
            average_latency_ms=65.0,
            total_runs=148,
            total_cost_usd=0.12,
            permissions=["read_crm", "read_finance", "read_support", "read_marketing"],
            forbidden_actions=["execute_action", "modify_policy", "write_memory"]
        ),
        AgentCardInfo(
            agent_type="aggregator",
            name="World State Aggregator",
            description="Synthesizes multiple raw connector snapshots into a single consistent WorldState representation.",
            model="mock-reasoning-v1 (Medium)",
            prompt_version="1.0.0",
            status="ACTIVE",
            success_rate_percentage=100.0,
            average_latency_ms=45.0,
            total_runs=148,
            total_cost_usd=0.08,
            permissions=["read_observations", "read_entities", "read_metrics"],
            forbidden_actions=["execute_action", "modify_policy"]
        ),
        AgentCardInfo(
            agent_type="planner",
            name="Decision Planner",
            description="Reasons over WorldState, goals, and memory context to propose bounded action plans with evidence.",
            model="mock-reasoning-v1 (Strong Reasoning)",
            prompt_version="1.0.0",
            status="ACTIVE",
            success_rate_percentage=97.8,
            average_latency_ms=140.0,
            total_runs=142,
            total_cost_usd=0.35,
            permissions=["read_world_state", "read_policies", "read_memory"],
            forbidden_actions=["execute_action", "modify_policy", "modify_guardrails"]
        ),
        AgentCardInfo(
            agent_type="critic",
            name="Decision Critic",
            description="Adversarially validates planner logic, cross-checks evidence in WorldState, and flags hallucination risk.",
            model="mock-critic-v1 (Strong Reasoning)",
            prompt_version="1.0.0",
            status="ACTIVE",
            success_rate_percentage=98.5,
            average_latency_ms=95.0,
            total_runs=142,
            total_cost_usd=0.26,
            permissions=["read_world_state", "read_decision", "read_policies"],
            forbidden_actions=["execute_action", "modify_decision"]
        ),
        AgentCardInfo(
            agent_type="actuator",
            name="Action Actuator",
            description="Dispatches approved actions to external integrations with strict idempotency and rollback recording.",
            model="deterministic-connector",
            prompt_version="1.0.0",
            status="ACTIVE",
            success_rate_percentage=98.9,
            average_latency_ms=28.0,
            total_runs=136,
            total_cost_usd=0.00,
            permissions=["execute_crm", "execute_finance", "execute_support", "execute_email"],
            forbidden_actions=["modify_policy", "modify_guardrails", "read_credentials"]
        ),
        AgentCardInfo(
            agent_type="evaluator",
            name="Outcome Evaluator",
            description="Measures before-and-after empirical metric deltas to quantify goal fulfillment and side effects.",
            model="mock-eval-v1 (Medium/Strong)",
            prompt_version="1.0.0",
            status="ACTIVE",
            success_rate_percentage=99.1,
            average_latency_ms=80.0,
            total_runs=136,
            total_cost_usd=0.16,
            permissions=["read_metrics", "read_actions", "read_observations"],
            forbidden_actions=["execute_action", "modify_policy"]
        ),
        AgentCardInfo(
            agent_type="adapter",
            name="Operations Adapter",
            description="Learns from longitudinal evaluations, updates confidence priors, and proposes versioned policy revisions.",
            model="mock-adapter-v1 (Medium/Strong)",
            prompt_version="1.0.0",
            status="ACTIVE",
            success_rate_percentage=98.2,
            average_latency_ms=70.0,
            total_runs=136,
            total_cost_usd=0.14,
            permissions=["read_evaluations", "read_policies", "read_memory"],
            forbidden_actions=["execute_action", "modify_guardrails_directly"]
        ),
    ]


@router.get("/runs", response_model=List[AgentRunResponse])
async def list_agent_runs(
    agent_type: str = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agent.read"))
):
    stmt = select(AgentRun)
    if agent_type:
        stmt = stmt.where(AgentRun.agent_type == agent_type.lower())
    stmt = stmt.order_by(desc(AgentRun.created_at)).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/prompts", response_model=List[PromptVersionResponse])
async def list_prompt_versions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agent.read"))
):
    stmt = select(PromptVersion).order_by(desc(PromptVersion.created_at))
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/router/status")
async def get_router_status(
    current_user: User = Depends(require_permission("agent.read"))
):
    """Returns real-time status of all LLM providers in the fallback chain and local Ollama models."""
    from backend.app.agents.llm_router import llm_router
    return await llm_router.get_providers_status()


@router.get("/budget/summary")
async def get_budget_summary(
    current_user: User = Depends(require_permission("agent.read"))
):
    """Returns token consumption, spend breakdowns, and budget limits."""
    from backend.app.agents.budget import budget_manager
    return budget_manager.get_summary()


@router.post("/router/test")
async def test_llm_router(
    agent_type: str = Query(default="observer"),
    prompt: str = Query(default="Analyze current operational metrics and flag any anomalies."),
    current_user: User = Depends(require_permission("agent.read"))
):
    """Executes a diagnostic test through the Multi-LLM fallback router."""
    from backend.app.agents.llm_router import llm_router
    res = await llm_router.generate_with_fallback(
        agent_type=agent_type,
        system_prompt=f"You are the {agent_type} agent for an Autonomous AI Operations Manager.",
        user_prompt=prompt,
        temperature=0.2,
    )
    return {
        "status": "SUCCESS",
        "provider_used": res.provider,
        "model_name": res.model_name,
        "latency_ms": res.latency_ms,
        "input_tokens": res.input_tokens,
        "output_tokens": res.output_tokens,
        "cost_usd": res.cost_usd,
        "fallback_occurred": res.fallback_occurred,
        "fallback_reason": res.fallback_reason,
        "parsed_json": res.parsed_json,
    }

