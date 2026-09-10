from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.services.audit_service import AuditService
from backend.app.schemas.audit import AuditEventResponse, SystemEventResponse, NotificationResponse
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User

router = APIRouter(prefix="/audit", tags=["Audit & Logs"])


@router.get("/events", response_model=List[AuditEventResponse])
async def list_audit_events(
    domain: Optional[str] = None,
    actor_type: Optional[str] = None,
    action: Optional[str] = None,
    result: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit.read"))
):
    return await AuditService.list_events(
        db, domain=domain, actor_type=actor_type, action=action, result=result, limit=limit, offset=offset
    )


@router.get("/system-events", response_model=List[SystemEventResponse])
async def list_system_events(
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit.read"))
):
    return await AuditService.list_system_events(db, limit=limit)


@router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    limit: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("dashboard.read"))
):
    return await AuditService.list_notifications(db, user_id=current_user.id, limit=limit)
