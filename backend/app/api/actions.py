from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone
from backend.app.core.database import get_db
from backend.app.models.action import ActionExecution, RollbackRecord
from backend.app.models.audit import AuditEvent
from backend.app.schemas.action import ActionExecutionResponse, ActionRollbackRequest
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User
from backend.app.agents.actuator import ActuatorAgent
from backend.app.core.exceptions import NotFoundError, AppError
from backend.app.core.telemetry import metrics

router = APIRouter(prefix="/actions", tags=["Actions"])


@router.get("", response_model=List[ActionExecutionResponse])
async def list_actions(
    target_system: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("action.read"))
):
    stmt = select(ActionExecution)
    if target_system:
        stmt = stmt.where(ActionExecution.target_system == target_system.lower())
    if status:
        stmt = stmt.where(ActionExecution.status == status.upper())
    stmt = stmt.order_by(desc(ActionExecution.created_at)).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.post("/{action_id}/rollback", response_model=ActionExecutionResponse)
async def rollback_action(
    action_id: str,
    req: ActionRollbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("action.rollback"))
):
    stmt = select(ActionExecution).where(ActionExecution.id == action_id)
    res = await db.execute(stmt)
    action_exec = res.scalar_one_or_none()
    if not action_exec:
        raise NotFoundError("ActionExecution", action_id)

    if action_exec.status == "ROLLED_BACK":
        raise AppError(code="ALREADY_ROLLED_BACK", message="Action has already been rolled back.")

    actuator = ActuatorAgent()
    rollback_res = await actuator.rollback(
        target_system=action_exec.target_system,
        action_type=action_exec.action_type,
        rollback_payload={"reason": req.reason, "action_id": action_exec.id}
    )

    action_exec.status = "ROLLED_BACK"
    
    # Save Rollback Record
    rb = RollbackRecord(
        action_execution_id=action_exec.id,
        status=rollback_res.get("status", "COMPLETED"),
        initiated_by=current_user.email,
        rollback_payload={"reason": req.reason},
        completed_at=datetime.now(timezone.utc)
    )
    db.add(rb)

    # Save Audit Event
    audit = AuditEvent(
        actor_id=current_user.id,
        actor_type="USER",
        actor_email=current_user.email,
        action=f"action.rollback.{action_exec.action_type}",
        domain="operations",
        resource_type="action_execution",
        resource_id=action_exec.id,
        result="SUCCESS",
        risk_level="HIGH",
        trace_id=action_exec.cycle_id,
        details={"reason": req.reason}
    )
    db.add(audit)
    metrics.increment("actions_rolled_back")

    await db.commit()
    await db.refresh(action_exec)
    return action_exec
