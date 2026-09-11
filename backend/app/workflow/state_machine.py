import uuid
import yaml
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.models.cycle import ODAEACycle, WorldState
from backend.app.models.observation import ObservationSnapshot, ObservationEntity, ObservationAnomaly
from backend.app.models.decision import DecisionRecord, DecisionAction, DecisionEvidence
from backend.app.models.critic import CriticReview
from backend.app.models.guardrail import GuardrailEvaluation
from backend.app.models.approval import ApprovalRequest
from backend.app.models.action import ActionExecution, ActionSideEffect, IdempotencyKey
from backend.app.models.evaluation import EvaluationReport
from backend.app.models.policy import PolicyVersion, PolicyUpdate
from backend.app.models.agent import AgentRun
from backend.app.models.audit import AuditEvent, Notification

from backend.app.agents.observer import ObserverAgent
from backend.app.agents.aggregator import AggregatorAgent
from backend.app.agents.planner import PlannerAgent
from backend.app.agents.critic import CriticAgent
from backend.app.agents.actuator import ActuatorAgent
from backend.app.agents.evaluator import EvaluatorAgent
from backend.app.agents.adapter import AdapterAgent

from backend.app.guardrails.engine import GuardrailEngine
from backend.app.integrations.registry import integration_registry
from backend.app.memory.episodic import EpisodicMemoryManager
from backend.app.memory.semantic import SemanticMemoryStore
from backend.app.core.websocket import ws_manager
from backend.app.core.telemetry import metrics
from backend.app.core.logging import logger


class ODAEAFlowEngine:
    """Durable state machine orchestrator for closed-loop ODAEA business operations cycles."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.observer = ObserverAgent()
        self.aggregator = AggregatorAgent()
        self.planner = PlannerAgent()
        self.critic = CriticAgent()
        self.actuator = ActuatorAgent()
        self.evaluator = EvaluatorAgent()
        self.adapter = AdapterAgent()

    async def _get_active_policy(self) -> Dict[str, Any]:
        """Loads active policy rules from database or fallback default."""
        stmt = select(PolicyVersion).where(PolicyVersion.is_active == True).limit(1)
        res = await self.db.execute(stmt)
        policy = res.scalar_one_or_none()
        if policy and policy.rules_json:
            return policy.rules_json
        
        # Fallback default rules
        return {
            "autonomy_tiers": {"tier_2": {"auto_execution_allowed": True}},
            "global_limits": {
                "max_autonomous_spend_per_action_usd": 5000.0,
                "max_blast_radius_entities": 10,
                "min_confidence_threshold": 0.85,
                "disallow_irreversible_autonomous_actions": True,
            },
            "forbidden_actions_all_tiers": ["delete_customer_database", "modify_system_guardrails_autonomously"],
            "domain_rules": {
                "sales": {"allowed_autonomous_actions": ["send_followup_email", "update_lead_score", "assign_account_rep"]},
                "finance": {"allowed_autonomous_actions": ["retry_failed_invoice", "send_payment_reminder", "issue_micro_refund"], "max_autonomous_refund_usd": 500.0},
                "support": {"allowed_autonomous_actions": ["send_sla_escalation", "update_priority", "assign_specialist"]},
                "marketing": {"allowed_autonomous_actions": ["pause_underperforming_ad_set", "increase_bid_for_high_roas"]},
            }
        }

    async def start_cycle(
        self,
        domain: str = "sales",
        trigger_type: str = "MANUAL",
        correlation_id: Optional[str] = None,
        autonomy_tier: int = 2,
        organization_id: Optional[str] = None,
        ticket_data: Optional[Dict[str, Any]] = None
    ) -> ODAEACycle:
        cid = correlation_id or f"corr_{uuid.uuid4().hex[:12]}"
        
        meta = {"autonomy_tier": autonomy_tier}
        if ticket_data:
            meta["ticket_data"] = ticket_data
            domain = "finance"

        cycle = ODAEACycle(
            organization_id=organization_id,
            domain=domain.lower(),
            status="OBSERVING",
            trigger_type=trigger_type,
            correlation_id=cid,
            current_stage="OBSERVE",
            stage_progress={"OBSERVE": "RUNNING"},
            metadata_json=meta,
        )
        self.db.add(cycle)
        await self.db.commit()
        await self.db.refresh(cycle)

        # Broadcast WebSocket event
        await ws_manager.broadcast("cycle_started", {
            "cycle_id": cycle.id,
            "domain": cycle.domain,
            "trigger_type": trigger_type,
            "correlation_id": cid,
        }, correlation_id=cid)

        # Run cycle step-by-step
        await self.execute_cycle_step(cycle.id, autonomy_tier)
        return cycle

    async def execute_cycle_step(self, cycle_id: str, autonomy_tier: int = 2):
        """Executes next stages of the cycle with full persistence."""
        stmt = select(ODAEACycle).where(ODAEACycle.id == cycle_id)
        res = await self.db.execute(stmt)
        cycle = res.scalar_one_or_none()
        if not cycle or cycle.status in ("COMPLETED", "FAILED", "AWAITING_APPROVAL", "CANCELLED"):
            return

        policy_rules = await self._get_active_policy()

        try:
            # -------------------------------------------------------------
            # STAGE 1: OBSERVE
            # -------------------------------------------------------------
            cycle.current_stage = "OBSERVE"
            cycle.status = "OBSERVING"
            cycle.stage_progress = {**(cycle.stage_progress or {}), "OBSERVE": "RUNNING"}
            await self.db.commit()

            ticket_data = (cycle.metadata_json or {}).get("ticket_data")

            # Connectors observation
            connector = integration_registry.get(cycle.domain) or integration_registry.get("finance") or integration_registry.get("crm")
            raw_obs = await connector.fetch_observations() if connector else {}
            
            if ticket_data:
                amt = float(ticket_data.get("amount_usd", 25.0))
                cust = ticket_data.get("customer_email", "ravitejatalapaneni@gmail.com")
                chg = ticket_data.get("charge_id", "ch_live_demo_25")
                sbj = ticket_data.get("subject", "Customer refund request")
                raw_obs["source"] = "customer_support_ticket"
                raw_obs["entities"] = [
                    {
                        "entity_type": "ticket",
                        "entity_id": f"TICK-{chg}",
                        "attributes": {
                            "subject": sbj,
                            "amount_usd": amt,
                            "customer_email": cust,
                            "charge_id": chg,
                            "status": "open_pending_refund"
                        },
                        "risk_indicator": 0.85 if amt > 500 else 0.2
                    }
                ]
                raw_obs["metrics"] = {
                    "refund_requested_usd": amt,
                    "customer_impact_score": 0.95
                }

            obs_result = await self.observer.observe(cycle.domain, raw_obs)

            if ticket_data:
                amt = float(ticket_data.get("amount_usd", 25.0))
                cust = ticket_data.get("customer_email", "ravitejatalapaneni@gmail.com")
                chg = ticket_data.get("charge_id", "ch_live_demo_25")
                sbj = ticket_data.get("subject", "Customer refund request")
                obs_result["summary"] = f"Ingested support ticket: Customer {cust} requests ${amt:.2f} refund on transaction {chg}."
                obs_result["anomalies"] = [
                    {
                        "entity_id": f"TICK-{chg}",
                        "severity": "CRITICAL" if amt > 1000 else ("HIGH" if amt > 500 else "MEDIUM"),
                        "description": f"Customer refund requested: ${amt:.2f} for {cust} on charge {chg} ({sbj})",
                        "confidence": 0.96,
                        "recommended_action": "issue_micro_refund"
                    }
                ]
            
            # Save Agent Run
            m_obs = obs_result["model_metadata"]
            run_obs = AgentRun(
                cycle_id=cycle.id,
                agent_type="observer",
                model_name=m_obs["model_name"],
                prompt_version=m_obs["prompt_version"],
                prompt_hash=m_obs["prompt_hash"],
                input_tokens=m_obs["input_tokens"],
                output_tokens=m_obs["output_tokens"],
                cost_usd=m_obs["cost_usd"],
                latency_ms=m_obs["latency_ms"],
                status="SUCCESS"
            )
            self.db.add(run_obs)

            snapshot = ObservationSnapshot(
                cycle_id=cycle.id,
                domain=cycle.domain,
                source_system=connector.connector_type if connector else "internal",
                raw_data_summary=obs_result["summary"],
                payload=raw_obs,
                status="COMPLETED"
            )
            self.db.add(snapshot)
            await self.db.flush()

            # Save Entities & Anomalies
            for ent in raw_obs.get("entities", []):
                o_ent = ObservationEntity(
                    snapshot_id=snapshot.id,
                    domain=cycle.domain,
                    entity_type=ent.get("entity_type", "entity"),
                    entity_id=ent.get("entity_id", "ENT-0"),
                    attributes=ent.get("attributes", {}),
                    risk_indicator=ent.get("risk_indicator", 0.0)
                )
                self.db.add(o_ent)

            detected_anomalies = []
            for anom in obs_result.get("anomalies", []):
                o_anom = ObservationAnomaly(
                    snapshot_id=snapshot.id,
                    cycle_id=cycle.id,
                    domain=cycle.domain,
                    entity_id=anom.get("entity_id", "UNKNOWN"),
                    severity=anom.get("severity", "MEDIUM"),
                    description=anom.get("description", "Anomaly detected"),
                    confidence=anom.get("confidence", 0.9),
                    recommended_action=anom.get("recommended_action", "review"),
                )
                self.db.add(o_anom)
                detected_anomalies.append(o_anom)

            cycle.stage_progress = {**(cycle.stage_progress or {}), "OBSERVE": "COMPLETED"}
            await self.db.commit()

            await ws_manager.broadcast("observation_created", {
                "cycle_id": cycle.id,
                "snapshot_id": snapshot.id,
                "summary": obs_result["summary"],
                "anomalies_count": len(detected_anomalies)
            }, correlation_id=cycle.correlation_id)

            # -------------------------------------------------------------
            # STAGE 2: AGGREGATE -> WORLD STATE
            # -------------------------------------------------------------
            agg_result = await self.aggregator.aggregate(cycle.domain, [raw_obs], [a.description for a in detected_anomalies])
            world_state = WorldState(
                cycle_id=cycle.id,
                domain=cycle.domain,
                state_data=agg_result["state_data"],
                aggregate_metrics=agg_result["aggregate_metrics"],
                entity_count=agg_result["entity_count"],
                anomaly_count=agg_result["anomaly_count"],
                confidence_score=agg_result["confidence_score"]
            )
            self.db.add(world_state)
            await self.db.commit()

            # -------------------------------------------------------------
            # STAGE 3: DECIDE (PLANNER)
            # -------------------------------------------------------------
            cycle.current_stage = "DECIDE"
            cycle.status = "DECIDING"
            cycle.stage_progress = {**(cycle.stage_progress or {}), "DECIDE": "RUNNING"}
            await self.db.commit()

            # Retrieve semantic memory
            memory_context = await SemanticMemoryStore.search(self.db, f"operations in {cycle.domain}", domain=cycle.domain, limit=3)

            plan_result = await self.planner.plan(
                domain=cycle.domain,
                world_state=agg_result["state_data"],
                policy_rules=policy_rules,
                memory_context=memory_context
            )

            # Save Agent Run
            m_plan = plan_result["model_metadata"]
            run_plan = AgentRun(
                cycle_id=cycle.id,
                agent_type="planner",
                model_name=m_plan["model_name"],
                prompt_version=m_plan["prompt_version"],
                prompt_hash=m_plan["prompt_hash"],
                input_tokens=m_plan["input_tokens"],
                output_tokens=m_plan["output_tokens"],
                cost_usd=m_plan["cost_usd"],
                latency_ms=m_plan["latency_ms"],
                status="SUCCESS"
            )
            self.db.add(run_plan)

            decision = DecisionRecord(
                cycle_id=cycle.id,
                domain=cycle.domain,
                goal=plan_result["goal"],
                rationale_summary=plan_result["rationale_summary"],
                confidence=plan_result["confidence"],
                estimated_cost_usd=plan_result["estimated_cost_usd"],
                risk_level=plan_result["risk_level"],
                blast_radius_count=plan_result["blast_radius_count"],
                reversibility=plan_result["reversibility"],
                status="PROPOSED"
            )
            self.db.add(decision)
            await self.db.flush()

            # Save proposed actions
            saved_actions = []
            if ticket_data:
                amt = float(ticket_data.get("amount_usd", 25.0))
                cust = ticket_data.get("customer_email", "ravitejatalapaneni@gmail.com")
                chg = ticket_data.get("charge_id", "ch_live_demo_25")
                sbj = ticket_data.get("subject", "Customer refund request")

                decision.goal = f"Issue ${amt:.2f} refund via Stripe and dispatch notification to {cust}"
                decision.estimated_cost_usd = amt
                decision.risk_level = "CRITICAL" if amt > 1000 else ("HIGH" if amt > 500 else "LOW")
                decision.rationale_summary = f"Customer support ticket requesting ${amt:.2f} refund on transaction {chg}. Formulated micro-refund and customer email notification."

                proposed_actions_list = [
                    {
                        "action_type": "issue_micro_refund",
                        "target_system": "finance",
                        "payload": {
                            "charge_id": chg,
                            "invoice_id": f"INV-{chg}",
                            "amount_usd": amt,
                            "customer_id": cust,
                            "reason": sbj
                        },
                        "estimated_cost_usd": amt,
                        "risk_score": 0.85 if amt > 500 else 0.15,
                        "blast_radius": 1,
                        "is_reversible": True,
                        "sequence_order": 1
                    },
                    {
                        "action_type": "send_followup_email",
                        "target_system": "email",
                        "payload": {
                            "recipient": cust,
                            "subject": f"Refund Processed: ${amt:.2f} for order ({chg})",
                            "message": (
                                f"Hello,\n\nYour refund request of ${amt:.2f} for transaction {chg} has been processed successfully via Stripe.\n\n"
                                f"This operational action was reviewed and executed autonomously by the Autonomous AI Business Operations Manager.\n\n"
                                f"Ticket Reference: {sbj}"
                            ),
                            "body_html": (
                                f"<div style='background: #FAF8F5; border: 1px solid #E2DAD0; border-radius: 12px; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;'>"
                                f"<div style='display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;'>"
                                f"<span style='font-size: 12px; font-weight: 700; color: #8E5633; letter-spacing: 0.05em; text-transform: uppercase;'>Refund Receipt</span>"
                                f"<span style='background: #E8F5E9; color: #2E7D32; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 9999px;'>SETTLED</span>"
                                f"</div>"
                                f"<div style='font-size: 32px; font-weight: 700; color: #1C1917; margin-bottom: 8px;'>${amt:.2f} <span style='font-size: 14px; font-weight: 500; color: #78716C;'>USD</span></div>"
                                f"<p style='font-size: 14px; color: #44403C; margin: 0 0 16px 0; line-height: 1.5;'>Your refund for transaction <code>{chg}</code> has been approved and issued via Stripe.</p>"
                                f"<div style='background: #FFFFFF; border: 1px solid #E2DAD0; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #57534E; margin-bottom: 16px;'>"
                                f"<div style='margin-bottom: 6px;'><strong>Order Reference:</strong> {chg}</div>"
                                f"<div style='margin-bottom: 6px;'><strong>Ticket Subject:</strong> {sbj}</div>"
                                f"<div style='margin-bottom: 6px;'><strong>Amount Credited:</strong> ${amt:.2f} USD</div>"
                                f"<div><strong>Processed By:</strong> Autonomous AI Operations Manager</div>"
                                f"</div>"
                                f"<p style='font-size: 12px; color: #A8A29E; margin: 0;'>Funds typically reflect in the original payment method in 5-10 business days depending on your issuing bank.</p>"
                                f"</div>"
                            )
                        },
                        "estimated_cost_usd": 0.0,
                        "risk_score": 0.1,
                        "blast_radius": 1,
                        "is_reversible": True,
                        "sequence_order": 2
                    }
                ]
            else:
                proposed_actions_list = plan_result.get("proposed_actions", [])

            for act in proposed_actions_list:
                d_act = DecisionAction(
                    decision_id=decision.id,
                    action_type=act.get("action_type", "send_followup_email"),
                    target_system=act.get("target_system", "email"),
                    payload=act.get("payload", {}),
                    estimated_cost_usd=act.get("estimated_cost_usd", 0.0),
                    risk_score=act.get("risk_score", 0.1),
                    blast_radius=act.get("blast_radius", 1),
                    is_reversible=act.get("is_reversible", True),
                    sequence_order=act.get("sequence_order", 1)
                )
                self.db.add(d_act)
                saved_actions.append(d_act)

            # Save evidence
            for ev in plan_result.get("evidence", []):
                d_ev = DecisionEvidence(
                    decision_id=decision.id,
                    source_type=ev.get("source_type", "observation"),
                    reference_id=ev.get("reference_id", "REF-0"),
                    snippet=ev.get("snippet", "Observed metric"),
                    confidence_contribution=ev.get("confidence_contribution", 0.9)
                )
                self.db.add(d_ev)

            cycle.stage_progress = {**(cycle.stage_progress or {}), "DECIDE": "COMPLETED"}
            await self.db.commit()

            await ws_manager.broadcast("decision_created", {
                "cycle_id": cycle.id,
                "decision_id": decision.id,
                "goal": decision.goal,
                "actions_count": len(saved_actions),
                "risk_level": decision.risk_level
            }, correlation_id=cycle.correlation_id)

            # -------------------------------------------------------------
            # STAGE 4: CRITIQUE (CRITIC)
            # -------------------------------------------------------------
            cycle.current_stage = "CRITIQUE"
            cycle.status = "CRITIQUING"
            cycle.stage_progress = {**(cycle.stage_progress or {}), "CRITIQUE": "RUNNING"}
            await self.db.commit()

            critic_res = await self.critic.review(
                decision_plan=plan_result,
                world_state=agg_result["state_data"],
                policy_rules=policy_rules
            )

            # Save Critic Run
            m_crit = critic_res["model_metadata"]
            run_crit = AgentRun(
                cycle_id=cycle.id,
                agent_type="critic",
                model_name=m_crit["model_name"],
                prompt_version=m_crit["prompt_version"],
                prompt_hash=m_crit["prompt_hash"],
                input_tokens=m_crit["input_tokens"],
                output_tokens=m_crit["output_tokens"],
                cost_usd=m_crit["cost_usd"],
                latency_ms=m_crit["latency_ms"],
                status="SUCCESS"
            )
            self.db.add(run_crit)

            critic_review = CriticReview(
                decision_id=decision.id,
                cycle_id=cycle.id,
                review_status=critic_res["review_status"],
                reasoning_critique=critic_res["reasoning_critique"],
                risk_assessment=critic_res["risk_assessment"],
                logic_score=critic_res["logic_score"],
                hallucination_risk=critic_res["hallucination_risk"],
                recommendations=critic_res["recommendations"]
            )
            self.db.add(critic_review)
            
            decision.critic_approved = (critic_res["review_status"] == "APPROVED")
            cycle.stage_progress = {**(cycle.stage_progress or {}), "CRITIQUE": "COMPLETED"}
            await self.db.commit()

            # -------------------------------------------------------------
            # STAGE 5: GUARDRAIL EVALUATION
            # -------------------------------------------------------------
            cycle.current_stage = "GUARDRAIL"
            cycle.status = "GUARDRAIL_CHECK"
            cycle.stage_progress = {**(cycle.stage_progress or {}), "GUARDRAIL": "RUNNING"}
            await self.db.commit()

            # Evaluate primary action
            primary_action = saved_actions[0] if saved_actions else None
            if not primary_action:
                cycle.status = "COMPLETED"
                cycle.current_stage = "COMPLETED"
                cycle.completed_at = datetime.now(timezone.utc)
                await self.db.commit()
                return

            guardrail_res = GuardrailEngine.evaluate(
                domain=cycle.domain,
                action_type=primary_action.action_type,
                target_system=primary_action.target_system,
                payload=primary_action.payload,
                estimated_cost_usd=primary_action.estimated_cost_usd,
                blast_radius=primary_action.blast_radius,
                confidence=decision.confidence,
                is_reversible=primary_action.is_reversible,
                autonomy_tier=autonomy_tier,
                policy_rules=policy_rules
            )

            guard_eval = GuardrailEvaluation(
                decision_id=decision.id,
                cycle_id=cycle.id,
                action_id=primary_action.id,
                decision_result=guardrail_res.decision_result,
                violated_policies=guardrail_res.violated_policies,
                evaluated_tier=autonomy_tier,
                risk_score=guardrail_res.risk_score,
                estimated_cost_usd=primary_action.estimated_cost_usd,
                blast_radius_count=primary_action.blast_radius,
                rule_evaluation_trace=guardrail_res.rule_evaluation_trace,
                summary_reason=guardrail_res.summary_reason
            )
            self.db.add(guard_eval)
            decision.guardrail_status = guardrail_res.decision_result
            cycle.stage_progress = {**(cycle.stage_progress or {}), "GUARDRAIL": "COMPLETED"}
            await self.db.commit()

            # -------------------------------------------------------------
            # GUARDRAIL BRANCH: BLOCK / REQUIRE_APPROVAL / ALLOW
            # -------------------------------------------------------------
            if guardrail_res.decision_result == "BLOCK":
                metrics.increment("actions_blocked")
                cycle.status = "COMPLETED"
                cycle.current_stage = "GUARDRAIL"
                cycle.completed_at = datetime.now(timezone.utc)
                decision.status = "BLOCKED"
                await self.db.commit()

                await ws_manager.broadcast("guardrail_blocked", {
                    "cycle_id": cycle.id,
                    "reason": guardrail_res.summary_reason,
                    "violations": guardrail_res.violated_policies
                }, correlation_id=cycle.correlation_id)
                return

            elif guardrail_res.decision_result == "REQUIRE_APPROVAL":
                metrics.increment("approvals_requested")
                cycle.status = "AWAITING_APPROVAL"
                cycle.current_stage = "APPROVAL"
                cycle.stage_progress = {**(cycle.stage_progress or {}), "APPROVAL": "PENDING"}
                decision.status = "CRITIQUED"

                approval_req = ApprovalRequest(
                    decision_id=decision.id,
                    cycle_id=cycle.id,
                    action_id=primary_action.id,
                    domain=cycle.domain,
                    requested_by_agent="planner",
                    risk_level=guardrail_res.risk_level,
                    cost_usd=primary_action.estimated_cost_usd,
                    blast_radius_count=primary_action.blast_radius,
                    summary=f"Approval needed for '{primary_action.action_type}' on '{primary_action.target_system}'. {guardrail_res.summary_reason}",
                    status="PENDING"
                )
                self.db.add(approval_req)

                notification = Notification(
                    title=f"Approval Required: {primary_action.action_type}",
                    message=approval_req.summary,
                    notification_type="APPROVAL_REQUIRED",
                    link_url=f"/approvals?id={approval_req.id}"
                )
                self.db.add(notification)
                await self.db.commit()

                await ws_manager.broadcast("approval_required", {
                    "cycle_id": cycle.id,
                    "approval_id": approval_req.id,
                    "action_type": primary_action.action_type,
                    "risk_level": approval_req.risk_level,
                    "summary": approval_req.summary
                }, correlation_id=cycle.correlation_id)
                # Pause cycle awaiting operator decision
                return

            # If ALLOW: Proceed immediately with autonomous execution
            await self._resume_execution_after_approval(cycle, decision, saved_actions, autonomy_tier)

        except Exception as e:
            logger.error(f"Cycle {cycle_id} execution error: {str(e)}", exc_info=True)
            cycle.status = "FAILED"
            cycle.error_message = str(e)
            cycle.completed_at = datetime.now(timezone.utc)
            await self.db.commit()

    async def _resume_execution_after_approval(
        self,
        cycle: ODAEACycle,
        decision: DecisionRecord,
        actions: List[DecisionAction],
        autonomy_tier: int
    ):
        """Executes Act, Evaluate, and Adapt stages."""
        # -------------------------------------------------------------
        # STAGE 6: ACT (ACTUATOR & IDEMPOTENCY)
        # -------------------------------------------------------------
        cycle.current_stage = "ACT"
        cycle.status = "ACTING"
        cycle.stage_progress = {**(cycle.stage_progress or {}), "ACT": "RUNNING"}
        await self.db.commit()

        executed_actions_records = []
        for act in actions:
            idempotency_key = f"idem_{cycle.id}_{act.id}_{act.action_type}"
            
            # Check Idempotency Key in DB
            stmt_idem = select(IdempotencyKey).where(IdempotencyKey.key == idempotency_key)
            res_idem = await self.db.execute(stmt_idem)
            existing_idem = res_idem.scalar_one_or_none()

            if existing_idem and existing_idem.status == "COMPLETED":
                logger.warning(f"Action {act.action_type} skipped due to existing idempotency key {idempotency_key}")
                continue

            idem_record = IdempotencyKey(key=idempotency_key, action_id=act.id, status="PENDING")
            self.db.add(idem_record)
            await self.db.flush()

            action_exec = ActionExecution(
                decision_id=decision.id,
                cycle_id=cycle.id,
                action_type=act.action_type,
                target_system=act.target_system,
                idempotency_key=idempotency_key,
                payload_summary=act.payload,
                status="RUNNING"
            )
            self.db.add(action_exec)
            await self.db.flush()

            await ws_manager.broadcast("action_started", {
                "cycle_id": cycle.id,
                "action_type": act.action_type,
                "target_system": act.target_system,
                "idempotency_key": idempotency_key
            }, correlation_id=cycle.correlation_id)

            # Actuator execution
            exec_res = await self.actuator.execute(
                target_system=act.target_system,
                action_type=act.action_type,
                payload=act.payload,
                idempotency_key=idempotency_key
            )

            action_exec.status = "COMPLETED"
            action_exec.completed_at = datetime.now(timezone.utc)
            action_exec.result_data = exec_res.get("result_data", {})
            idem_record.status = "COMPLETED"
            idem_record.response_data = exec_res.get("result_data", {})

            # Record side effects
            for se in exec_res.get("side_effects", []):
                side_effect = ActionSideEffect(
                    action_execution_id=action_exec.id,
                    entity_type=se.get("entity_type", "entity"),
                    entity_id=se.get("entity_id", "ID-0"),
                    before_state=se.get("before", {}),
                    after_state=se.get("after", {})
                )
                self.db.add(side_effect)

            executed_actions_records.append(action_exec)
            metrics.increment("actions_executed")

            # Audit Event
            audit = AuditEvent(
                actor_id="actuator_agent",
                actor_type="AGENT",
                actor_email="actuator@system.local",
                action=act.action_type,
                domain=cycle.domain,
                resource_type="action_execution",
                resource_id=action_exec.id,
                result="SUCCESS",
                risk_level=decision.risk_level,
                trace_id=cycle.correlation_id,
                details=act.payload
            )
            self.db.add(audit)

        decision.status = "EXECUTED"
        cycle.stage_progress = {**(cycle.stage_progress or {}), "ACT": "COMPLETED"}
        await self.db.commit()

        await ws_manager.broadcast("action_completed", {
            "cycle_id": cycle.id,
            "actions_executed_count": len(executed_actions_records)
        }, correlation_id=cycle.correlation_id)

        # -------------------------------------------------------------
        # STAGE 7: EVALUATE (EVALUATOR)
        # -------------------------------------------------------------
        cycle.current_stage = "EVALUATE"
        cycle.status = "EVALUATING"
        cycle.stage_progress = {**(cycle.stage_progress or {}), "EVALUATE": "RUNNING"}
        await self.db.commit()

        eval_res = await self.evaluator.evaluate(
            domain=cycle.domain,
            action_type=actions[0].action_type if actions else "general",
            before_metrics={"lead_engagement_score": 42.0, "response_time_hours": 48.2},
            expected_effect={"target_score": 85.0}
        )

        m_eval = eval_res["model_metadata"]
        run_eval = AgentRun(
            cycle_id=cycle.id,
            agent_type="evaluator",
            model_name=m_eval["model_name"],
            prompt_version=m_eval["prompt_version"],
            prompt_hash=m_eval["prompt_hash"],
            input_tokens=m_eval["input_tokens"],
            output_tokens=m_eval["output_tokens"],
            cost_usd=m_eval["cost_usd"],
            latency_ms=m_eval["latency_ms"],
            status="SUCCESS"
        )
        self.db.add(run_eval)

        eval_report = EvaluationReport(
            cycle_id=cycle.id,
            action_execution_id=executed_actions_records[0].id if executed_actions_records else None,
            domain=cycle.domain,
            before_metrics=eval_res["before_metrics"],
            after_metrics=eval_res["after_metrics"],
            metric_deltas=eval_res["metric_deltas"],
            expected_effect=eval_res["expected_effect"],
            actual_outcome=eval_res["actual_outcome"],
            goal_achieved=eval_res["goal_achieved"],
            confidence_score=eval_res["confidence_score"],
            adaptation_notes=eval_res["adaptation_notes"]
        )
        self.db.add(eval_report)
        cycle.stage_progress = {**(cycle.stage_progress or {}), "EVALUATE": "COMPLETED"}
        await self.db.commit()

        await ws_manager.broadcast("evaluation_completed", {
            "cycle_id": cycle.id,
            "outcome": eval_report.actual_outcome,
            "goal_achieved": eval_report.goal_achieved
        }, correlation_id=cycle.correlation_id)

        # -------------------------------------------------------------
        # STAGE 8: ADAPT (ADAPTER)
        # -------------------------------------------------------------
        cycle.current_stage = "ADAPT"
        cycle.status = "ADAPTING"
        cycle.stage_progress = {**(cycle.stage_progress or {}), "ADAPT": "RUNNING"}
        await self.db.commit()

        adapt_res = await self.adapter.adapt(cycle.domain, eval_res, [])
        m_adapt = adapt_res["model_metadata"]
        run_adapt = AgentRun(
            cycle_id=cycle.id,
            agent_type="adapter",
            model_name=m_adapt["model_name"],
            prompt_version=m_adapt["prompt_version"],
            prompt_hash=m_adapt["prompt_hash"],
            input_tokens=m_adapt["input_tokens"],
            output_tokens=m_adapt["output_tokens"],
            cost_usd=m_adapt["cost_usd"],
            latency_ms=m_adapt["latency_ms"],
            status="SUCCESS"
        )
        self.db.add(run_adapt)

        policy_update = PolicyUpdate(
            evaluation_id=eval_report.id,
            proposed_by_agent="adapter",
            proposed_changes=adapt_res["proposed_changes"],
            rationale=adapt_res["rationale"],
            status="PROPOSED"
        )
        self.db.add(policy_update)

        # -------------------------------------------------------------
        # STAGE 9: RECORD IN EPISODIC MEMORY & COMPLETE CYCLE
        # -------------------------------------------------------------
        await EpisodicMemoryManager.record_episode(
            db=self.db,
            domain=cycle.domain,
            cycle_id=cycle.id,
            goal=decision.goal,
            episode_summary=f"Cycle executed {len(executed_actions_records)} actions in {cycle.domain}. Evaluated outcome: {eval_report.actual_outcome}.",
            actions_taken=[a.action_type for a in actions],
            outcome=eval_report.actual_outcome,
            reward_score=1.0 if eval_report.goal_achieved else -0.5,
            confidence=eval_report.confidence_score
        )

        cycle.current_stage = "COMPLETED"
        cycle.status = "COMPLETED"
        cycle.stage_progress = {**(cycle.stage_progress or {}), "ADAPT": "COMPLETED"}
        cycle.completed_at = datetime.now(timezone.utc)
        metrics.increment("cycles_successful")
        await self.db.commit()

        logger.info(f"ODAEA Cycle {cycle.id} finished successfully with outcome {eval_report.actual_outcome}.")
