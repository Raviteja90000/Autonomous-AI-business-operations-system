from typing import Dict, Any, List


class RiskCalculator:
    """Calculates quantitative risk scores (0.0 to 1.0) and determines risk tiers."""

    HIGH_RISK_ACTION_TYPES = {
        "grant_service_credit",
        "apply_credit_note",
        "issue_micro_refund",
        "pause_underperforming_ad_set",
        "scale_worker_pool",
        "override_billing_status",
        "execute_database_cleanup",
    }

    IRREVERSIBLE_ACTION_TYPES = {
        "send_external_email",
        "send_followup_email",
        "issue_micro_refund",
        "delete_stale_records",
        "terminate_subscription",
    }

    @classmethod
    def calculate_risk(
        cls,
        action_type: str,
        estimated_cost_usd: float,
        blast_radius: int,
        confidence: float,
        is_reversible: bool,
    ) -> Dict[str, Any]:
        base_score = 0.1

        # Cost impact (scaled up to $5000 max autonomous spend)
        cost_factor = min(estimated_cost_usd / 5000.0, 1.0) * 0.4
        
        # Blast radius impact (scaled up to 10 entities)
        blast_factor = min(blast_radius / 10.0, 1.0) * 0.25

        # Confidence uncertainty impact
        uncertainty_factor = max(0.0, (1.0 - confidence)) * 0.2

        # Reversibility penalty
        reversibility_penalty = 0.2 if not is_reversible else 0.0

        # Action type inherent risk
        type_risk = 0.15 if action_type in cls.HIGH_RISK_ACTION_TYPES else 0.0

        total_risk_score = min(
            1.0,
            round(base_score + cost_factor + blast_factor + uncertainty_factor + reversibility_penalty + type_risk, 3)
        )

        if total_risk_score >= 0.75:
            risk_level = "CRITICAL"
        elif total_risk_score >= 0.50:
            risk_level = "HIGH"
        elif total_risk_score >= 0.25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "risk_score": total_risk_score,
            "risk_level": risk_level,
            "is_reversible": is_reversible and (action_type not in cls.IRREVERSIBLE_ACTION_TYPES),
            "factors": {
                "cost_factor": round(cost_factor, 3),
                "blast_factor": round(blast_factor, 3),
                "uncertainty_factor": round(uncertainty_factor, 3),
                "reversibility_penalty": reversibility_penalty,
                "type_risk": type_risk,
            }
        }
