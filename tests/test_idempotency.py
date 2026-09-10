import pytest
from backend.app.agents.actuator import ActuatorAgent


@pytest.mark.asyncio
async def test_actuator_idempotency_and_validation():
    actuator = ActuatorAgent()
    idempotency_key = "idem_test_key_001"

    # First execution
    res1 = await actuator.execute(
        target_system="crm",
        action_type="update_lead_score",
        payload={"lead_id": "LEAD-9042", "new_score": 95},
        idempotency_key=idempotency_key
    )

    assert res1["status"] == "COMPLETED"
    assert len(res1["side_effects"]) > 0

    # Test rollback
    rb_res = await actuator.rollback(
        target_system="crm",
        action_type="update_lead_score",
        rollback_payload={"lead_id": "LEAD-9042", "previous_score": 85}
    )
    assert rb_res["status"] == "ROLLED_BACK"
