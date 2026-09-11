from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.models.cycle import ODAEACycle, WorldState
from backend.app.workflow.state_machine import ODAEAFlowEngine
from backend.app.core.exceptions import NotFoundError


class CycleService:
    @classmethod
    async def list_cycles(
        cls,
        db: AsyncSession,
        domain: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[ODAEACycle]:
        stmt = select(ODAEACycle)
        if domain:
            stmt = stmt.where(ODAEACycle.domain == domain.lower())
        if status:
            stmt = stmt.where(ODAEACycle.status == status.upper())
        stmt = stmt.order_by(desc(ODAEACycle.created_at)).offset(offset).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def get_by_id(cls, db: AsyncSession, cycle_id: str) -> ODAEACycle:
        stmt = select(ODAEACycle).where(ODAEACycle.id == cycle_id)
        res = await db.execute(stmt)
        cycle = res.scalar_one_or_none()
        if not cycle:
            raise NotFoundError("ODAEACycle", cycle_id)
        return cycle

    @classmethod
    async def trigger_cycle(
        cls,
        db: AsyncSession,
        domain: str = "sales",
        trigger_type: str = "MANUAL",
        autonomy_tier: int = 2,
        correlation_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        ticket_data: Optional[Dict[str, Any]] = None
    ) -> ODAEACycle:
        engine = ODAEAFlowEngine(db)
        cycle = await engine.start_cycle(
            domain=domain,
            trigger_type=trigger_type,
            correlation_id=correlation_id,
            autonomy_tier=autonomy_tier,
            organization_id=organization_id,
            ticket_data=ticket_data
        )
        return cycle
