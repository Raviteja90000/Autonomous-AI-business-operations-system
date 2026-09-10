from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.services.cycle_service import CycleService
from backend.app.schemas.cycle import CycleResponse, CycleDetailResponse, CycleTriggerRequest
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User

router = APIRouter(prefix="/cycles", tags=["ODAEA Cycles"])


@router.get("", response_model=List[CycleResponse])
async def list_cycles(
    domain: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("cycle.read"))
):
    return await CycleService.list_cycles(db, domain=domain, status=status, limit=limit, offset=offset)


from sqlalchemy import select
from backend.app.models.decision import DecisionRecord
from backend.app.models.action import ActionExecution
from backend.app.models.evaluation import EvaluationReport
from backend.app.models.approval import ApprovalRequest
from backend.app.schemas.decision import DecisionRecordResponse
from backend.app.schemas.action import ActionExecutionResponse
from backend.app.schemas.evaluation import EvaluationReportResponse
from backend.app.schemas.approval import ApprovalRequestResponse


@router.get("/{cycle_id}", response_model=CycleDetailResponse)
async def get_cycle(
    cycle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("cycle.read"))
):
    cycle = await CycleService.get_by_id(db, cycle_id)
    
    # Query related records
    dec_res = await db.execute(select(DecisionRecord).where(DecisionRecord.cycle_id == cycle.id))
    dec_obj = dec_res.scalar_one_or_none()
    
    act_res = await db.execute(select(ActionExecution).where(ActionExecution.cycle_id == cycle.id))
    act_objs = list(act_res.scalars().all())
    
    eval_res = await db.execute(select(EvaluationReport).where(EvaluationReport.cycle_id == cycle.id))
    eval_obj = eval_res.scalar_one_or_none()
    
    appr_res = await db.execute(select(ApprovalRequest).where(ApprovalRequest.cycle_id == cycle.id))
    appr_obj = appr_res.scalar_one_or_none()

    return CycleDetailResponse(
        id=cycle.id,
        organization_id=cycle.organization_id,
        domain=cycle.domain,
        status=cycle.status,
        trigger_type=cycle.trigger_type,
        correlation_id=cycle.correlation_id,
        started_at=cycle.started_at,
        completed_at=cycle.completed_at,
        current_stage=cycle.current_stage,
        stage_progress=cycle.stage_progress,
        metadata_json=cycle.metadata_json,
        error_message=cycle.error_message,
        created_at=cycle.created_at,
        world_states=[ws for ws in cycle.world_states],
        decision=DecisionRecordResponse.model_validate(dec_obj) if dec_obj else None,
        actions=[ActionExecutionResponse.model_validate(a) for a in act_objs],
        evaluation=EvaluationReportResponse.model_validate(eval_obj) if eval_obj else None,
        approval=ApprovalRequestResponse.model_validate(appr_obj) if appr_obj else None,
    )


@router.post("/trigger", response_model=CycleResponse)
async def trigger_cycle(
    req: CycleTriggerRequest,
    autonomy_tier: int = Query(default=2, ge=0, le=3),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("cycle.trigger"))
):
    cycle = await CycleService.trigger_cycle(
        db,
        domain=req.domain,
        trigger_type=req.trigger_type,
        autonomy_tier=autonomy_tier,
        correlation_id=req.correlation_id
    )
    return cycle
