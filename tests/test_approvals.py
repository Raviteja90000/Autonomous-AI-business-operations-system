import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.workflow.state_machine import ODAEAFlowEngine
from backend.app.services.approval_service import ApprovalService
from backend.app.models.approval import ApprovalRequest
from backend.app.models.cycle import ODAEACycle


@pytest.mark.asyncio
async def test_human_in_the_loop_approval_flow(db_session: AsyncSession):
    # Running cycle in Tier 1 enforces human approval for every proposal
    engine = ODAEAFlowEngine(db_session)
    cycle = await engine.start_cycle(domain="sales", trigger_type="MANUAL", autonomy_tier=1)

    assert cycle.status == "AWAITING_APPROVAL"

    # Find pending approval request
    appr_res = await db_session.execute(
        select(ApprovalRequest).where(ApprovalRequest.cycle_id == cycle.id)
    )
    req = appr_res.scalar_one_or_none()
    assert req is not None
    assert req.status == "PENDING"

    # Operator approves action
    decided_req = await ApprovalService.decide(
        db=db_session,
        approval_id=req.id,
        reviewer_id="user_admin",
        reviewer_email="operator@ops.ai",
        action="APPROVE",
        notes="Approved during automated test"
    )

    assert decided_req.status == "APPROVED"

    # Verify cycle resumed to COMPLETED
    cycle_res = await db_session.execute(select(ODAEACycle).where(ODAEACycle.id == cycle.id))
    updated_cycle = cycle_res.scalar_one_or_none()
    assert updated_cycle.status == "COMPLETED"
    assert updated_cycle.stage_progress.get("ACT") == "COMPLETED"
    assert updated_cycle.stage_progress.get("EVALUATE") == "COMPLETED"
