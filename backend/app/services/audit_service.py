from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.models.audit import AuditEvent, SystemEvent, Notification


class AuditService:
    @classmethod
    async def list_events(
        cls,
        db: AsyncSession,
        domain: Optional[str] = None,
        actor_type: Optional[str] = None,
        action: Optional[str] = None,
        result: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[AuditEvent]:
        stmt = select(AuditEvent)
        if domain:
            stmt = stmt.where(AuditEvent.domain == domain.lower())
        if actor_type:
            stmt = stmt.where(AuditEvent.actor_type == actor_type.upper())
        if action:
            stmt = stmt.where(AuditEvent.action.ilike(f"%{action}%"))
        if result:
            stmt = stmt.where(AuditEvent.result == result.upper())

        stmt = stmt.order_by(desc(AuditEvent.timestamp)).offset(offset).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def list_system_events(cls, db: AsyncSession, limit: int = 50) -> List[SystemEvent]:
        stmt = select(SystemEvent).order_by(desc(SystemEvent.created_at)).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def list_notifications(cls, db: AsyncSession, user_id: Optional[str] = None, limit: int = 20) -> List[Notification]:
        stmt = select(Notification).order_by(desc(Notification.created_at)).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())
