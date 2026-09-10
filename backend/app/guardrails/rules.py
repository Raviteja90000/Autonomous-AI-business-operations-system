from typing import Dict, Any, List, Tuple
from backend.app.core.kill_switch import kill_switch


class GuardrailRuleEvaluator:
    """Evaluates individual deterministic guardrail rules against an action."""

    @staticmethod
    def check_kill_switch(domain: str, action_type: str, target_system: str) -> Tuple[bool, str]:
        if kill_switch.is_global_active():
            return False, "GLOBAL kill switch is currently ACTIVE."
        if kill_switch.is_domain_active(domain):
            return False, f"Domain kill switch is ACTIVE for domain '{domain}'."
        if kill_switch.is_agent_active("actuator"):
            return False, "Actuator agent kill switch is currently ACTIVE."
        if kill_switch.is_integration_active(target_system):
            return False, f"Integration kill switch is ACTIVE for target system '{target_system}'."
        return True, "Kill switch check passed."

    @staticmethod
    def check_forbidden_actions(action_type: str, policy_rules: Dict[str, Any]) -> Tuple[bool, str]:
        forbidden = policy_rules.get("forbidden_actions_all_tiers", [])
        if action_type in forbidden:
            return False, f"Action '{action_type}' is strictly forbidden by enterprise governance policy."
        return True, "Forbidden action check passed."

    @staticmethod
    def check_domain_allowed_actions(domain: str, action_type: str, policy_rules: Dict[str, Any]) -> Tuple[bool, str]:
        domain_cfg = policy_rules.get("domain_rules", {}).get(domain.lower(), {})
        allowed = domain_cfg.get("allowed_autonomous_actions", [])
        if allowed and action_type not in allowed:
            return False, f"Action '{action_type}' is not registered under authorized domain actions for '{domain}'."
        return True, f"Action '{action_type}' is registered under domain '{domain}'."

    @staticmethod
    def check_budget_limits(
        estimated_cost_usd: float,
        policy_rules: Dict[str, Any],
        domain: str
    ) -> Tuple[bool, str, bool]:
        """Returns (passed, message, requires_approval)"""
        global_limits = policy_rules.get("global_limits", {})
        max_spend_action = global_limits.get("max_autonomous_spend_per_action_usd", 5000.0)

        # Domain specific refund/credit limits
        domain_rules = policy_rules.get("domain_rules", {}).get(domain.lower(), {})
        max_refund = domain_rules.get("max_autonomous_refund_usd")

        if estimated_cost_usd > max_spend_action:
            return False, f"Action estimated cost (${estimated_cost_usd:.2f}) exceeds max allowable autonomous spend (${max_spend_action:.2f}).", True
        
        if max_refund and estimated_cost_usd > max_refund:
            return False, f"Action cost (${estimated_cost_usd:.2f}) exceeds domain '{domain}' limit (${max_refund:.2f}).", True

        return True, f"Cost (${estimated_cost_usd:.2f}) is within autonomous limits.", False

    @staticmethod
    def check_blast_radius(blast_radius: int, policy_rules: Dict[str, Any]) -> Tuple[bool, str, bool]:
        global_limits = policy_rules.get("global_limits", {})
        max_blast = global_limits.get("max_blast_radius_entities", 10)

        if blast_radius > max_blast:
            return False, f"Blast radius ({blast_radius} entities) exceeds autonomous safety threshold ({max_blast} entities).", True
        return True, f"Blast radius ({blast_radius} entities) is within safety threshold.", False

    @staticmethod
    def check_confidence(confidence: float, policy_rules: Dict[str, Any]) -> Tuple[bool, str, bool]:
        global_limits = policy_rules.get("global_limits", {})
        min_conf = global_limits.get("min_confidence_threshold", 0.85)

        if confidence < min_conf:
            return False, f"Confidence ({confidence:.2f}) is below minimum threshold ({min_conf:.2f}).", True
        return True, f"Confidence ({confidence:.2f}) satisfies threshold ({min_conf:.2f}).", False

    @staticmethod
    def check_reversibility(
        is_reversible: bool,
        policy_rules: Dict[str, Any],
        autonomy_tier: int
    ) -> Tuple[bool, str, bool]:
        global_limits = policy_rules.get("global_limits", {})
        disallow_irreversible = global_limits.get("disallow_irreversible_autonomous_actions", True)

        if not is_reversible and disallow_irreversible and autonomy_tier < 3:
            return False, "Irreversible action cannot execute autonomously under current tier. Human approval required.", True
        return True, "Reversibility check passed.", False
