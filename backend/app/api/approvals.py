from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.services.approval_service import ApprovalService
from backend.app.schemas.approval import ApprovalRequestResponse, ApprovalDecisionRequest
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.get("", response_model=List[ApprovalRequestResponse])
async def list_pending_approvals(
    domain: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("dashboard.read"))
):
    return await ApprovalService.list_pending(db, domain=domain)


@router.get("/{approval_id}", response_model=ApprovalRequestResponse)
async def get_approval(
    approval_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("dashboard.read"))
):
    return await ApprovalService.get_by_id(db, approval_id)


@router.post("/{approval_id}/decide", response_model=ApprovalRequestResponse)
async def decide_approval(
    approval_id: str,
    req: ApprovalDecisionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("decision.approve"))
):
    return await ApprovalService.decide(
        db=db,
        approval_id=approval_id,
        reviewer_id=current_user.id,
        reviewer_email=current_user.email,
        action=req.action,
        notes=req.notes
    )
