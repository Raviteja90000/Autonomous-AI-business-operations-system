from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.observation import ObservationSnapshot, ObservationAnomaly, ObservationEntity
from backend.app.schemas.observation import ObservationSnapshotResponse, ObservationAnomalyResponse
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User

router = APIRouter(prefix="/observations", tags=["Observations"])


@router.get("/snapshots", response_model=List[ObservationSnapshotResponse])
async def list_snapshots(
    domain: Optional[str] = None,
    limit: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("observation.read"))
):
    stmt = select(ObservationSnapshot)
    if domain:
        stmt = stmt.where(ObservationSnapshot.domain == domain.lower())
    stmt = stmt.order_by(desc(ObservationSnapshot.created_at)).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/anomalies", response_model=List[ObservationAnomalyResponse])
async def list_anomalies(
    domain: Optional[str] = None,
    resolved: Optional[bool] = None,
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("observation.read"))
):
    stmt = select(ObservationAnomaly)
    if domain:
        stmt = stmt.where(ObservationAnomaly.domain == domain.lower())
    if resolved is not None:
        stmt = stmt.where(ObservationAnomaly.is_resolved == resolved)
    stmt = stmt.order_by(desc(ObservationAnomaly.detected_at)).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())
