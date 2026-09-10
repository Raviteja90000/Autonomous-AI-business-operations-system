from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.services.policy_service import PolicyService
from backend.app.schemas.policy import (
    PolicyVersionResponse,
    PolicyUpdateResponse,
    DecidePolicyUpdateRequest,
)
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User
from backend.app.core.exceptions import NotFoundError

router = APIRouter(prefix="/policies", tags=["Policies & Governance"])


@router.get("/versions", response_model=List[PolicyVersionResponse])
async def list_policy_versions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("policy.read"))
):
    return await PolicyService.list_versions(db)


@router.get("/active", response_model=PolicyVersionResponse)
async def get_active_policy(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("policy.read"))
):
    pol = await PolicyService.get_active(db)
    if not pol:
        raise NotFoundError("PolicyVersion", "active")
    return pol


@router.post("/versions/{version_id}/activate", response_model=PolicyVersionResponse)
async def activate_policy_version(
    version_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("policy.update"))
):
    return await PolicyService.activate_version(db, version_id, approved_by=current_user.email)


@router.get("/updates", response_model=List[PolicyUpdateResponse])
async def list_policy_updates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("policy.read"))
):
    return await PolicyService.list_updates(db)


@router.post("/updates/{update_id}/decide", response_model=PolicyUpdateResponse)
async def decide_policy_update(
    update_id: str,
    payload: DecidePolicyUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("policy.update"))
):
    return await PolicyService.decide_update(
        db,
        update_id=update_id,
        action=payload.action,
        approved_by=current_user.email
    )

