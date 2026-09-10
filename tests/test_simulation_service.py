import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.services.simulation_service import ScenarioSimulationService, SCENARIO_CATALOG


def test_list_simulation_scenarios():
    scenarios = ScenarioSimulationService.list_scenarios()
    assert len(scenarios) == 4
    scenario_ids = [s["id"] for s in scenarios]
    assert "scenario_enterprise_churn" in scenario_ids
    assert "scenario_stripe_fraud" in scenario_ids
    assert "scenario_github_ticket_storm" in scenario_ids
    assert "scenario_marketing_cpa_spike" in scenario_ids


@pytest.mark.asyncio
async def test_run_enterprise_churn_simulation(db_session: AsyncSession):
    res = await ScenarioSimulationService.run_scenario(
        db=db_session,
        scenario_id="scenario_enterprise_churn",
        autonomy_tier=2,
    )
    assert res["status"] == "SUCCESS"
    assert res["scenario_id"] == "scenario_enterprise_churn"
    assert res["cycle_id"] is not None
    assert res["cycle_status"] in ("COMPLETED", "AWAITING_APPROVAL")
    assert "OBSERVE" in res["stage_progress"]
    assert "DECIDE" in res["stage_progress"]


@pytest.mark.asyncio
async def test_run_stripe_fraud_simulation(db_session: AsyncSession):
    res = await ScenarioSimulationService.run_scenario(
        db=db_session,
        scenario_id="scenario_stripe_fraud",
        autonomy_tier=2,
    )
    assert res["status"] == "SUCCESS"
    assert res["domain"] == "finance"
    assert res["cycle_status"] in ("COMPLETED", "AWAITING_APPROVAL")
    assert res["decision"] is not None

