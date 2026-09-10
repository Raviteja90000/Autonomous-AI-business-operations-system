from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.evaluation import EvaluationReport
from backend.app.schemas.evaluation import EvaluationReportResponse
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])


@router.get("", response_model=List[EvaluationReportResponse])
async def list_evaluations(
    domain: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("evaluation.read"))
):
    stmt = select(EvaluationReport)
    if domain:
        stmt = stmt.where(EvaluationReport.domain == domain.lower())
    stmt = stmt.order_by(desc(EvaluationReport.created_at)).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())
