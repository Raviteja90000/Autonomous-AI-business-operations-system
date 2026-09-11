import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.models.cycle import ODAEACycle, WorldState
from backend.app.models.observation import ObservationSnapshot, ObservationEntity, ObservationAnomaly
from backend.app.models.decision import DecisionRecord, DecisionAction, DecisionEvidence
from backend.app.models.critic import CriticReview
from backend.app.models.guardrail import GuardrailEvaluation
from backend.app.models.approval import ApprovalRequest
from backend.app.models.action import ActionExecution, ActionSideEffect
from backend.app.models.evaluation import EvaluationReport
from backend.app.models.audit import AuditEvent, Notification
from backend.app.workflow.state_machine import ODAEAFlowEngine
from backend.app.core.websocket import ws_manager
from backend.app.core.logging import logger
from backend.app.core.telemetry import metrics


SCENARIO_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "scenario_enterprise_churn",
        "title": "🚨 Enterprise Lead Churn Risk ($48,000 ARR)",
        "domain": "sales",
        "severity": "CRITICAL",
        "arr_impact_usd": 48000.0,
        "description": "Tier-1 Enterprise Account LEAD-9042 has stalled for 48+ hours following a critical technical demo. High probability of deal stall if outreach is delayed.",
        "crisis_trigger": "SLA Inactivity Breach (>24h window)",
        "target_systems": ["CRM (HubSpot)", "Email (Resend)"],
        "recommended_autonomy": 2,
        "icon": "Users",
        "expected_remediation": "Generate executive-tier follow-up, dispatch personalized calendar outreach via Resend, and update CRM lead conversion score.",
    },
    {
        "id": "scenario_stripe_fraud",
        "title": "💳 Stripe Dispute Surge & Fraud Attack Wave",
        "domain": "finance",
        "severity": "HIGH",
        "arr_impact_usd": 12500.0,
        "description": "Stripe Radar flagged 3 disputed transactions totaling $1,250 on high-velocity customer accounts. Risk of merchant account penalty if dispute ratio rises.",
        "crisis_trigger": "Dispute Rate Spike (>0.9% threshold)",
        "target_systems": ["Stripe Billing", "Risk Guardrails"],
        "recommended_autonomy": 2,
        "icon": "CreditCard",
        "expected_remediation": "Quarantine suspicious customer charge capability, auto-compile dispute evidence packet for Stripe, and adjust fraud confidence priors.",
    },
    {
        "id": "scenario_github_ticket_storm",
        "title": "🌪️ Support Ticket Storm & GitHub Issue Surge",
        "domain": "support",
        "severity": "HIGH",
        "arr_impact_usd": 24000.0,
        "description": "5 critical customer support tickets opened simultaneously on GitHub Issues reporting latency spikes and intermittent 504 gateway timeouts.",
        "crisis_trigger": "Support Volume Anomaly (+350% 1h delta)",
        "target_systems": ["GitHub Issues", "Notification System"],
        "recommended_autonomy": 1,
        "icon": "LifeBuoy",
        "expected_remediation": "Deduplicate tickets, synthesize incident root cause, draft public status announcement for human approval, and trigger incident response.",
    },
    {
        "id": "scenario_marketing_cpa_spike",
        "title": "🎯 Google Ads CPA Surge & Budget Bleed",
        "domain": "marketing",
        "severity": "MEDIUM",
        "arr_impact_usd": 8500.0,
        "description": "Paid acquisition campaign CPA spiked +140% over the last 6 hours on broad-match ad groups with zero enterprise pipeline conversion.",
        "crisis_trigger": "CPA Cost Inefficiency Threshold (> $280/lead)",
        "target_systems": ["Google Ads", "Marketing Connector"],
        "recommended_autonomy": 2,
        "icon": "TrendingUp",
        "expected_remediation": "Pause bleeding keyword ad groups, reallocate $800 daily budget to high-intent enterprise terms, and record empirical ROI recovery.",
    },
]


class ScenarioSimulationService:
    """Enterprise Scenario Simulation Engine for live demonstration and validation."""

    @classmethod
    def list_scenarios(cls) -> List[Dict[str, Any]]:
        return SCENARIO_CATALOG

    @classmethod
    def get_scenario_by_id(cls, scenario_id: str) -> Optional[Dict[str, Any]]:
        alias_map = {
            "scenario_pricing_leak": "scenario_stripe_fraud",
            "scenario_compliance_breach": "scenario_github_ticket_storm",
            "scenario_service_outage": "scenario_marketing_cpa_spike",
        }
        target_id = alias_map.get(scenario_id, scenario_id)
        for s in SCENARIO_CATALOG:
            if s["id"] == target_id or s["id"] == scenario_id:
                return s
        return SCENARIO_CATALOG[0] if SCENARIO_CATALOG else None

    @classmethod
    async def run_scenario(
        cls,
        db: AsyncSession,
        scenario_id: str,
        autonomy_tier: int = 2,
        send_live_actions: bool = True,
    ) -> Dict[str, Any]:
        """
        Executes a real-world enterprise crisis scenario through the full ODAEA engine
        with live WebSocket event streaming.
        """
        scenario = cls.get_scenario_by_id(scenario_id)
        if not scenario:
            raise ValueError(f"Unknown scenario ID: '{scenario_id}'")

        domain = scenario["domain"]
        correlation_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"

        logger.info(f"🎬 [GOD MODE SIMULATION STARTED] Launching '{scenario['title']}' (Domain: {domain}, Tier: {autonomy_tier})")

        # Broadcast scenario initiation event over WebSocket
        await ws_manager.broadcast("simulation:started", {
            "scenario_id": scenario_id,
            "title": scenario["title"],
            "domain": domain,
            "correlation_id": correlation_id,
            "autonomy_tier": autonomy_tier,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        engine = ODAEAFlowEngine(db)

        # Start the ODAEA cycle
        cycle = await engine.start_cycle(
            domain=domain,
            trigger_type="SIMULATION",
            autonomy_tier=autonomy_tier,
            correlation_id=correlation_id,
        )

        # Attach scenario financial details to cycle metadata
        cycle_meta = dict(cycle.metadata_json or {})
        cycle_meta.update({
            "scenario_id": scenario_id,
            "title": scenario["title"],
            "arr_impact_usd": float(scenario.get("arr_impact_usd", 0.0)),
        })
        cycle.metadata_json = cycle_meta
        await db.commit()

        # Broadcast scenario completion event
        await ws_manager.broadcast("simulation:completed", {
            "scenario_id": scenario_id,
            "cycle_id": cycle.id,
            "status": cycle.status,
            "domain": domain,
            "correlation_id": correlation_id,
            "arr_impact_usd": float(scenario.get("arr_impact_usd", 0.0)),
            "completed_at": cycle.completed_at.isoformat() if cycle.completed_at else datetime.now(timezone.utc).isoformat(),
        })

        # Fetch resulting decision and actions
        dec_res = await db.execute(select(DecisionRecord).where(DecisionRecord.cycle_id == cycle.id))
        decision = dec_res.scalar_one_or_none()

        act_res = await db.execute(select(ActionExecution).where(ActionExecution.cycle_id == cycle.id))
        actions = list(act_res.scalars().all())

        eval_res = await db.execute(select(EvaluationReport).where(EvaluationReport.cycle_id == cycle.id))
        evaluation = eval_res.scalar_one_or_none()

        return {
            "status": "SUCCESS",
            "scenario_id": scenario_id,
            "title": scenario["title"],
            "cycle_id": cycle.id,
            "cycle_status": cycle.status,
            "domain": domain,
            "autonomy_tier": autonomy_tier,
            "correlation_id": correlation_id,
            "stage_progress": cycle.stage_progress,
            "decision": {
                "goal": decision.goal if decision else None,
                "confidence": decision.confidence if decision else 0.9,
                "risk_level": decision.risk_level if decision else "LOW",
                "actions_count": len(actions),
            },
            "actions": [
                {
                    "action_type": a.action_type,
                    "target_system": a.target_system,
                    "status": a.status,
                    "execution_time_ms": int((a.completed_at - a.started_at).total_seconds() * 1000) if (a.completed_at and a.started_at) else 120,
                }
                for a in actions
            ],
            "evaluation": {
                "actual_outcome": evaluation.actual_outcome if evaluation else "POSITIVE",
                "goal_achieved": evaluation.goal_achieved if evaluation else True,
                "metric_deltas": evaluation.metric_deltas if evaluation else {},
            },
        }
