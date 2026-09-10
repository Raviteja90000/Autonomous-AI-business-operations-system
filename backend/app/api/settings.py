from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.core.kill_switch import kill_switch
from backend.app.models.audit import AuditEvent
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User
from backend.app.core.config import settings
from backend.app.core.websocket import ws_manager

router = APIRouter(prefix="/settings", tags=["Settings & Governance Control"])


class KillSwitchToggleRequest(BaseModel):
    scope: str = Field(..., description="GLOBAL | DOMAIN | AGENT | INTEGRATION")
    target: Optional[str] = Field(default=None, description="domain/agent/integration key if scope != GLOBAL")
    active: bool


class AutonomyTierUpdateRequest(BaseModel):
    autonomy_tier: int = Field(..., ge=0, le=3)


@router.get("")
async def get_settings(
    current_user: User = Depends(require_permission("system.read"))
):
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "default_autonomy_tier": settings.DEFAULT_AUTONOMY_TIER,
        "max_autonomous_spend_usd": settings.MAX_AUTONOMOUS_SPEND_USD,
        "max_blast_radius_entities": settings.MAX_BLAST_RADIUS_ENTITIES,
        "min_confidence_threshold": settings.MIN_CONFIDENCE_THRESHOLD,
        "model_provider": settings.MODEL_PROVIDER,
        "models": {
            "observer": settings.MODEL_OBSERVER,
            "planner": settings.MODEL_PLANNER,
            "critic": settings.MODEL_CRITIC,
            "evaluator": settings.MODEL_EVALUATOR,
            "adapter": settings.MODEL_ADAPTER,
        },
        "kill_switch_state": kill_switch.get_state(),
    }


@router.get("/kill-switch")
async def get_kill_switch_status(
    current_user: User = Depends(require_permission("system.read"))
):
    return kill_switch.get_state()


@router.post("/kill-switch")
async def toggle_kill_switch(
    req: KillSwitchToggleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("system.kill_switch"))
):
    scope = req.scope.upper()
    if scope == "GLOBAL":
        kill_switch.set_global(req.active, actor=current_user.email)
    elif scope == "DOMAIN" and req.target:
        kill_switch.set_domain(req.target, req.active, actor=current_user.email)
    elif scope == "AGENT" and req.target:
        kill_switch.set_agent(req.target, req.active, actor=current_user.email)
    elif scope == "INTEGRATION" and req.target:
        kill_switch.set_integration(req.target, req.active, actor=current_user.email)

    # Record Audit Event
    audit = AuditEvent(
        actor_id=current_user.id,
        actor_type="USER",
        actor_email=current_user.email,
        action=f"kill_switch.toggle.{scope.lower()}",
        domain=req.target or "global",
        resource_type="kill_switch",
        resource_id=req.target or "global",
        result="SUCCESS",
        risk_level="CRITICAL",
        trace_id="kill_switch_action",
        details={"scope": scope, "target": req.target, "active": req.active}
    )
    db.add(audit)
    await db.commit()

    # Broadcast WebSocket Alert
    await ws_manager.broadcast("kill_switch_changed", {
        "scope": scope,
        "target": req.target,
        "active": req.active,
        "updated_by": current_user.email,
        "kill_switch_state": kill_switch.get_state(),
    })

    return {
        "message": f"Kill switch for {scope} ({req.target or 'all'}) updated to {req.active}.",
        "state": kill_switch.get_state()
    }
