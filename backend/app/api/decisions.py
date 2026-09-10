from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.decision import DecisionRecord
from backend.app.schemas.decision import DecisionRecordResponse
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User
from backend.app.core.exceptions import NotFoundError

router = APIRouter(prefix="/decisions", tags=["Decisions"])


@router.get("", response_model=List[DecisionRecordResponse])
async def list_decisions(
    domain: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("decision.read"))
):
    stmt = select(DecisionRecord)
    if domain:
        stmt = stmt.where(DecisionRecord.domain == domain.lower())
    if status:
        stmt = stmt.where(DecisionRecord.status == status.upper())
    stmt = stmt.order_by(desc(DecisionRecord.created_at)).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/{decision_id}", response_model=DecisionRecordResponse)
async def get_decision(
    decision_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("decision.read"))
):
    stmt = select(DecisionRecord).where(DecisionRecord.id == decision_id)
    res = await db.execute(stmt)
    dec = res.scalar_one_or_none()
    if not dec:
        raise NotFoundError("DecisionRecord", decision_id)
    return dec
