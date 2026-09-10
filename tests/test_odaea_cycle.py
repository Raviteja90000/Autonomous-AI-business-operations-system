import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.workflow.state_machine import ODAEAFlowEngine
from backend.app.models.cycle import ODAEACycle
from backend.app.models.decision import DecisionRecord
from backend.app.models.action import ActionExecution
from backend.app.models.evaluation import EvaluationReport


@pytest.mark.asyncio
async def test_full_odaea_cycle_execution(db_session: AsyncSession):
    engine = ODAEAFlowEngine(db_session)
    cycle = await engine.start_cycle(domain="sales", trigger_type="MANUAL", autonomy_tier=2)

    assert cycle is not None
    assert cycle.domain == "sales"
    assert cycle.status in ("COMPLETED", "AWAITING_APPROVAL")
    assert cycle.stage_progress.get("OBSERVE") == "COMPLETED"
    assert cycle.stage_progress.get("DECIDE") == "COMPLETED"
    assert cycle.stage_progress.get("CRITIQUING") == "COMPLETED" or cycle.stage_progress.get("CRITIQUE") == "COMPLETED"

    # Verify Decision Record was generated
    dec_res = await db_session.execute(select(DecisionRecord).where(DecisionRecord.cycle_id == cycle.id))
    decision = dec_res.scalar_one_or_none()
    assert decision is not None
    assert decision.goal is not None
    assert len(decision.actions) > 0
    assert len(decision.evidence) > 0

    # If completed in Tier 2, verify evaluation report exists
    if cycle.status == "COMPLETED":
        eval_res = await db_session.execute(select(EvaluationReport).where(EvaluationReport.cycle_id == cycle.id))
        report = eval_res.scalar_one_or_none()
        assert report is not None
        assert report.actual_outcome in ("POSITIVE", "NEUTRAL", "NEGATIVE")
