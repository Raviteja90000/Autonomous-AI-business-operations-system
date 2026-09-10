import pytest
from backend.app.guardrails.engine import GuardrailEngine
from backend.app.core.kill_switch import kill_switch


@pytest.fixture
def default_policy():
    return {
        "autonomy_tiers": {"tier_2": {"auto_execution_allowed": True}},
        "global_limits": {
            "max_autonomous_spend_per_action_usd": 5000.00,
            "max_blast_radius_entities": 10,
            "min_confidence_threshold": 0.85,
            "disallow_irreversible_autonomous_actions": True,
        },
        "forbidden_actions_all_tiers": ["delete_customer_database", "override_security_credentials"],
        "domain_rules": {
            "sales": {"allowed_autonomous_actions": ["send_followup_email", "update_lead_score"]},
            "finance": {"allowed_autonomous_actions": ["retry_failed_invoice"], "max_autonomous_refund_usd": 500.0},
        }
    }


def test_guardrail_low_risk_action_allowed(default_policy):
    res = GuardrailEngine.evaluate(
        domain="sales",
        action_type="update_lead_score",
        target_system="crm",
        payload={"lead_id": "LEAD-101", "score": 95},
        estimated_cost_usd=0.0,
        blast_radius=1,
        confidence=0.92,
        is_reversible=True,
        autonomy_tier=2,
        policy_rules=default_policy
    )
    assert res.decision_result == "ALLOW"
    assert res.risk_level == "LOW"


def test_guardrail_high_cost_exceeded_requires_approval(default_policy):
    res = GuardrailEngine.evaluate(
        domain="sales",
        action_type="update_lead_score",
        target_system="crm",
        payload={"lead_id": "LEAD-101"},
        estimated_cost_usd=8500.0,  # exceeds $5,000 limit
        blast_radius=1,
        confidence=0.92,
        is_reversible=True,
        autonomy_tier=2,
        policy_rules=default_policy
    )
    assert res.decision_result == "REQUIRE_APPROVAL"
    assert "BUDGET_LIMIT_EXCEEDED" in res.violated_policies


def test_guardrail_blast_radius_exceeded_requires_approval(default_policy):
    res = GuardrailEngine.evaluate(
        domain="sales",
        action_type="update_lead_score",
        target_system="crm",
        payload={"batch_update": True},
        estimated_cost_usd=100.0,
        blast_radius=45,  # exceeds 10 entities
        confidence=0.95,
        is_reversible=True,
        autonomy_tier=2,
        policy_rules=default_policy
    )
    assert res.decision_result == "REQUIRE_APPROVAL"
    assert "BLAST_RADIUS_EXCEEDED" in res.violated_policies


def test_guardrail_low_confidence_requires_approval(default_policy):
    res = GuardrailEngine.evaluate(
        domain="sales",
        action_type="update_lead_score",
        target_system="crm",
        payload={"lead_id": "LEAD-101"},
        estimated_cost_usd=0.0,
        blast_radius=1,
        confidence=0.62,  # below 0.85
        is_reversible=True,
        autonomy_tier=2,
        policy_rules=default_policy
    )
    assert res.decision_result == "REQUIRE_APPROVAL"
    assert "LOW_CONFIDENCE" in res.violated_policies


def test_guardrail_tier_0_blocks_all_actions(default_policy):
    res = GuardrailEngine.evaluate(
        domain="sales",
        action_type="update_lead_score",
        target_system="crm",
        payload={"lead_id": "LEAD-101"},
        estimated_cost_usd=0.0,
        blast_radius=1,
        confidence=0.99,
        is_reversible=True,
        autonomy_tier=0,  # Observe Only
        policy_rules=default_policy
    )
    assert res.decision_result == "BLOCK"
    assert "TIER_0_OBSERVE_ONLY" in res.violated_policies


def test_guardrail_forbidden_action_blocked(default_policy):
    res = GuardrailEngine.evaluate(
        domain="sales",
        action_type="delete_customer_database",
        target_system="crm",
        payload={},
        estimated_cost_usd=0.0,
        blast_radius=1,
        confidence=0.99,
        is_reversible=False,
        autonomy_tier=3,
        policy_rules=default_policy
    )
    assert res.decision_result == "BLOCK"
    assert "FORBIDDEN_ACTION_VIOLATION" in res.violated_policies


def test_guardrail_global_kill_switch_blocks(default_policy):
    kill_switch.set_global(True)
    try:
        res = GuardrailEngine.evaluate(
            domain="sales",
            action_type="update_lead_score",
            target_system="crm",
            payload={"lead_id": "LEAD-101"},
            estimated_cost_usd=0.0,
            blast_radius=1,
            confidence=0.95,
            is_reversible=True,
            autonomy_tier=2,
            policy_rules=default_policy
        )
        assert res.decision_result == "BLOCK"
        assert "KILL_SWITCH_ACTIVE" in res.violated_policies
    finally:
        kill_switch.set_global(False)
