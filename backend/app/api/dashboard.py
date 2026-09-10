from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.services.dashboard_service import DashboardService
from backend.app.schemas.dashboard import (
    DashboardOverviewResponse,
    ExecutiveReportResponse,
)
from backend.app.auth.dependencies import get_current_user, require_permission
from backend.app.models.auth import User
from backend.app.core.config import settings

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    autonomy_tier: int = Query(default=2, ge=0, le=3),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("dashboard.read"))
):
    return await DashboardService.get_overview(db, autonomy_tier=autonomy_tier)


@router.get("/executive-report", response_model=ExecutiveReportResponse)
async def get_executive_report(
    hourly_rate: float = Query(default=65.0, ge=10.0, le=1000.0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("dashboard.read"))
):
    return await DashboardService.get_executive_report(db, hourly_rate=hourly_rate)

