from typing import Dict, Any, List, Optional
from backend.app.guardrails.risk import RiskCalculator
from backend.app.guardrails.rules import GuardrailRuleEvaluator
from backend.app.core.logging import logger


class GuardrailResult:
    def __init__(
        self,
        decision_result: str,  # ALLOW | REQUIRE_APPROVAL | BLOCK
        risk_score: float,
        risk_level: str,
        violated_policies: List[str],
        rule_evaluation_trace: List[Dict[str, Any]],
        summary_reason: str,
        evaluated_tier: int,
    ):
        self.decision_result = decision_result
        self.risk_score = risk_score
        self.risk_level = risk_level
        self.violated_policies = violated_policies
        self.rule_evaluation_trace = rule_evaluation_trace
        self.summary_reason = summary_reason
        self.evaluated_tier = evaluated_tier

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decision_result": self.decision_result,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "violated_policies": self.violated_policies,
            "rule_evaluation_trace": self.rule_evaluation_trace,
            "summary_reason": self.summary_reason,
            "evaluated_tier": self.evaluated_tier,
        }


class GuardrailEngine:
    """Deterministic Guardrail Engine. Evaluates actions strictly without LLM bias."""

    @classmethod
    def evaluate(
        cls,
        domain: str,
        action_type: str,
        target_system: str,
        payload: Dict[str, Any],
        estimated_cost_usd: float,
        blast_radius: int,
        confidence: float,
        is_reversible: bool,
        autonomy_tier: int,
        policy_rules: Dict[str, Any],
    ) -> GuardrailResult:
        traces: List[Dict[str, Any]] = []
        violations: List[str] = []
        requires_approval = False
        hard_block = False
        summary_reasons: List[str] = []

        # 1. Tier 0 check: Observe only -> hard block all actions
        if autonomy_tier == 0:
            traces.append({
                "rule": "autonomy_tier_0_observe_only",
                "passed": False,
                "detail": "Autonomy Tier 0 is active (Observe Only). Autonomous execution is disabled.",
            })
            violations.append("TIER_0_OBSERVE_ONLY")
            return GuardrailResult(
                decision_result="BLOCK",
                risk_score=0.0,
                risk_level="LOW",
                violated_policies=violations,
                rule_evaluation_trace=traces,
                summary_reason="System is in Autonomy Tier 0 (Observe Only). All actions are prohibited.",
                evaluated_tier=0,
            )

        # 2. Kill Switch Check
        ks_passed, ks_msg = GuardrailRuleEvaluator.check_kill_switch(domain, action_type, target_system)
        traces.append({"rule": "kill_switch", "passed": ks_passed, "detail": ks_msg})
        if not ks_passed:
            violations.append("KILL_SWITCH_ACTIVE")
            hard_block = True
            summary_reasons.append(ks_msg)

        # 3. Forbidden Actions Check
        fb_passed, fb_msg = GuardrailRuleEvaluator.check_forbidden_actions(action_type, policy_rules)
        traces.append({"rule": "forbidden_actions", "passed": fb_passed, "detail": fb_msg})
        if not fb_passed:
            violations.append("FORBIDDEN_ACTION_VIOLATION")
            hard_block = True
            summary_reasons.append(fb_msg)

        # 4. Domain Action Registry Check
        dom_passed, dom_msg = GuardrailRuleEvaluator.check_domain_allowed_actions(domain, action_type, policy_rules)
        traces.append({"rule": "domain_action_registry", "passed": dom_passed, "detail": dom_msg})
        if not dom_passed:
            violations.append("UNREGISTERED_DOMAIN_ACTION")
            requires_approval = True
            summary_reasons.append(dom_msg)

        # 5. Quantitative Risk & Reversibility Calculation
        risk_calc = RiskCalculator.calculate_risk(
            action_type=action_type,
            estimated_cost_usd=estimated_cost_usd,
            blast_radius=blast_radius,
            confidence=confidence,
            is_reversible=is_reversible,
        )
        risk_score = risk_calc["risk_score"]
        risk_level = risk_calc["risk_level"]
        actual_reversibility = risk_calc["is_reversible"]

        # 6. Budget & Spend Limits Check
        budget_passed, budget_msg, budget_app = GuardrailRuleEvaluator.check_budget_limits(
            estimated_cost_usd, policy_rules, domain
        )
        traces.append({"rule": "budget_limits", "passed": budget_passed, "detail": budget_msg})
        if not budget_passed:
            violations.append("BUDGET_LIMIT_EXCEEDED")
            if budget_app:
                requires_approval = True
            summary_reasons.append(budget_msg)

        # 7. Blast Radius Safety Check
        blast_passed, blast_msg, blast_app = GuardrailRuleEvaluator.check_blast_radius(blast_radius, policy_rules)
        traces.append({"rule": "blast_radius", "passed": blast_passed, "detail": blast_msg})
        if not blast_passed:
            violations.append("BLAST_RADIUS_EXCEEDED")
            if blast_app:
                requires_approval = True
            summary_reasons.append(blast_msg)

        # 8. Confidence Threshold Check
        conf_passed, conf_msg, conf_app = GuardrailRuleEvaluator.check_confidence(confidence, policy_rules)
        traces.append({"rule": "confidence_threshold", "passed": conf_passed, "detail": conf_msg})
        if not conf_passed:
            violations.append("LOW_CONFIDENCE")
            if conf_app:
                requires_approval = True
            summary_reasons.append(conf_msg)

        # 9. Reversibility & Tier 1 Enforcement
        rev_passed, rev_msg, rev_app = GuardrailRuleEvaluator.check_reversibility(
            actual_reversibility, policy_rules, autonomy_tier
        )
        traces.append({"rule": "reversibility", "passed": rev_passed, "detail": rev_msg})
        if not rev_passed:
            violations.append("IRREVERSIBLE_ACTION_REQUIRES_APPROVAL")
            if rev_app:
                requires_approval = True
            summary_reasons.append(rev_msg)

        # 10. Tier 1 Rule: All actions require human approval
        if autonomy_tier == 1:
            requires_approval = True
            summary_reasons.append("Tier 1 active: Human-in-the-loop approval required for all actions.")

        # 11. High / Critical Risk triggers approval even in Tier 2
        if autonomy_tier == 2 and risk_level in ("HIGH", "CRITICAL"):
            requires_approval = True
            summary_reasons.append(f"Risk level is {risk_level} (score: {risk_score:.2f}). Human review required.")

        # Final Decision Resolution
        if hard_block:
            decision_result = "BLOCK"
            summary_text = "Action hard-blocked: " + " | ".join(summary_reasons)
        elif requires_approval:
            decision_result = "REQUIRE_APPROVAL"
            summary_text = "Action escalated for human approval: " + " | ".join(summary_reasons)
        else:
            decision_result = "ALLOW"
            summary_text = f"Action permitted for autonomous execution under Tier {autonomy_tier} (Risk: {risk_level}, Score: {risk_score:.2f})."

        logger.info(
            f"Guardrail evaluation: {decision_result} for action '{action_type}' in domain '{domain}' (Risk: {risk_level})",
            extra={"event": "guardrail_evaluation", "domain": domain, "result": decision_result}
        )

        return GuardrailResult(
            decision_result=decision_result,
            risk_score=risk_score,
            risk_level=risk_level,
            violated_policies=violations,
            rule_evaluation_trace=traces,
            summary_reason=summary_text,
            evaluated_tier=autonomy_tier,
        )
