import json
import yaml
import hashlib
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.models.auth import User, Role, UserRole
from backend.app.models.organization import Organization, Domain
from backend.app.models.policy import PolicyVersion
from backend.app.models.agent import PromptVersion
from backend.app.models.integration import Integration
from backend.app.models.memory import MemoryEpisode, MemoryDocument
from backend.app.models.observation import ObservationAnomaly
from backend.app.models.approval import ApprovalRequest
from backend.app.models.cycle import ODAEACycle, WorldState
from backend.app.models.decision import DecisionRecord, DecisionAction
from backend.app.models.audit import AuditEvent, Notification
from backend.app.core.security import get_password_hash, ROLE_PERMISSIONS
from backend.app.agents.prompts import PROMPT_REGISTRY
from backend.app.core.logging import logger


class SeedService:
    @classmethod
    async def seed_all(cls, db: AsyncSession):
        """Seeds the complete database with demo enterprise state."""
        # 1. Seed Roles
        for role_name, perms in ROLE_PERMISSIONS.items():
            res = await db.execute(select(Role).where(Role.name == role_name))
            if not res.scalar_one_or_none():
                role = Role(name=role_name, description=f"Standard {role_name} Role", permissions=list(perms))
                db.add(role)
        await db.commit()

        # 2. Seed Organization
        org_q = await db.execute(select(Organization).where(Organization.slug == "acme-enterprises"))
        org = org_q.scalar_one_or_none()
        if not org:
            org = Organization(
                name="Acme Enterprise Operations",
                slug="acme-enterprises",
                settings={"default_currency": "USD", "timezone": "UTC"}
            )
            db.add(org)
            await db.commit()
            await db.refresh(org)

        # 3. Seed Domains
        domains = [
            ("sales", "Sales & Deal Acceleration Pipeline", 2),
            ("finance", "Billing, Collections & Financial Ops", 2),
            ("support", "Customer Support & SLA Incident Escalation", 2),
            ("marketing", "Campaign Bid Optimization & Content", 2),
            ("operations", "Infrastructure & System Health Operations", 2),
        ]
        for d_name, d_desc, d_tier in domains:
            d_q = await db.execute(select(Domain).where(Domain.name == d_name))
            if not d_q.scalar_one_or_none():
                dom = Domain(
                    organization_id=org.id,
                    name=d_name,
                    description=d_desc,
                    is_active=True,
                    autonomy_tier=d_tier
                )
                db.add(dom)
        await db.commit()

        # 4. Seed Users
        users_to_seed = [
            ("admin@ops.ai", "System Admin", "AdminPass123!", "ADMIN"),
            ("operator@ops.ai", "Operations Lead", "OperatorPass123!", "OPERATOR"),
            ("approver@ops.ai", "Executive Approver", "ApproverPass123!", "APPROVER"),
            ("auditor@ops.ai", "Compliance Auditor", "AuditorPass123!", "AUDITOR"),
        ]

        for email, full_name, raw_pwd, role_name in users_to_seed:
            u_q = await db.execute(select(User).where(User.email == email))
            if not u_q.scalar_one_or_none():
                user = User(
                    email=email,
                    full_name=full_name,
                    hashed_password=get_password_hash(raw_pwd),
                    is_active=True,
                    organization_id=org.id
                )
                db.add(user)
                await db.flush()

                r_q = await db.execute(select(Role).where(Role.name == role_name))
                role_obj = r_q.scalar_one_or_none()
                if role_obj:
                    ur = UserRole(user_id=user.id, role_id=role_obj.id, role_name=role_name)
                    db.add(ur)
        await db.commit()

        # 5. Seed Policy v1.8.0
        pol_q = await db.execute(select(PolicyVersion).where(PolicyVersion.version_number == "v1.8.0"))
        if not pol_q.scalar_one_or_none():
            policy_yaml = """version: "1.8.0"
name: "Standard Enterprise Autonomous Operations Policy"
autonomy_tiers:
  tier_2:
    auto_execution_allowed: true
global_limits:
  max_autonomous_spend_per_action_usd: 5000.00
  max_blast_radius_entities: 10
  min_confidence_threshold: 0.85
  disallow_irreversible_autonomous_actions: true
domain_rules:
  sales:
    allowed_autonomous_actions:
      - "send_followup_email"
      - "update_lead_score"
      - "assign_account_rep"
  finance:
    allowed_autonomous_actions:
      - "retry_failed_invoice"
      - "send_payment_reminder"
      - "issue_micro_refund"
    max_autonomous_refund_usd: 500.00
  support:
    allowed_autonomous_actions:
      - "send_sla_escalation"
      - "update_priority"
      - "assign_specialist"
"""
            policy_json = {
                "version": "1.8.0",
                "autonomy_tiers": {"tier_2": {"auto_execution_allowed": True}},
                "global_limits": {
                    "max_autonomous_spend_per_action_usd": 5000.0,
                    "max_blast_radius_entities": 10,
                    "min_confidence_threshold": 0.85,
                    "disallow_irreversible_autonomous_actions": True,
                },
                "forbidden_actions_all_tiers": ["delete_customer_database", "override_security_credentials"],
                "domain_rules": {
                    "sales": {"allowed_autonomous_actions": ["send_followup_email", "update_lead_score", "assign_account_rep"]},
                    "finance": {"allowed_autonomous_actions": ["retry_failed_invoice", "send_payment_reminder", "issue_micro_refund"], "max_autonomous_refund_usd": 500.0},
                    "support": {"allowed_autonomous_actions": ["send_sla_escalation", "update_priority", "assign_specialist"]},
                    "marketing": {"allowed_autonomous_actions": ["pause_underperforming_ad_set", "increase_bid_for_high_roas"]},
                }
            }

            pv = PolicyVersion(
                version_number="v1.8.0",
                name="Standard Enterprise Governance Policy",
                description="Production policy defining spending limits, blast radius thresholds, and autonomy boundaries.",
                rules_yaml=policy_yaml,
                rules_json=policy_json,
                is_active=True,
                author="System Administrator",
                approved_by="Executive Committee"
            )
            db.add(pv)
            await db.commit()

        # 6. Seed Prompt Versions
        for agent_key, p_data in PROMPT_REGISTRY.items():
            pr_q = await db.execute(select(PromptVersion).where(PromptVersion.prompt_id == p_data["prompt_id"]))
            if not pr_q.scalar_one_or_none():
                h = hashlib.sha256(p_data["system_prompt"].encode("utf-8")).hexdigest()
                pv_obj = PromptVersion(
                    prompt_id=p_data["prompt_id"],
                    version=p_data["version"],
                    agent_type=agent_key,
                    system_prompt=p_data["system_prompt"],
                    template="{{input}}",
                    approved_by=p_data["approved_by"],
                    status="ACTIVE",
                    prompt_hash=h
                )
                db.add(pv_obj)
        await db.commit()

        # 7. Seed Integrations
        integrations_data = [
            ("HubSpot CRM Connector", "sales", "crm"),
            ("Stripe Billing Gateway", "finance", "finance"),
            ("Zendesk Support Suite", "support", "support"),
            ("SendGrid Communications", "sales", "email"),
            ("Google Ads Engine", "marketing", "marketing"),
        ]
        for name, dom, conn in integrations_data:
            i_q = await db.execute(select(Integration).where(Integration.name == name))
            if not i_q.scalar_one_or_none():
                integ = Integration(
                    name=name,
                    domain=dom,
                    connector_type=conn,
                    status="CONNECTED",
                    is_mock=True,
                    config={"rate_limit_per_minute": 120, "sandbox_mode": True},
                    error_rate_percentage=0.0
                )
                db.add(integ)
        await db.commit()

        # 8. Seed Playbooks / SOP Memory Documents
        docs_to_seed = [
            ("sales", "Enterprise Lead SLA Escalation Playbook", "When high ARR enterprise leads have no touchpoint for >48h, generate customized technical outreach to decision maker and bump CRM lead score.", "playbook"),
            ("finance", "Automated Dunning & Invoicing Grace Policy", "Invoices failing due to temporary insufficient funds should be retried 3 times over 72 hours before issuing manual collections flag.", "sop"),
            ("support", "P1 Urgent Ticket Incident Triage", "Enterprise SLA tickets with <30min remaining must be escalated to Tier 3 on-call specialist immediately.", "sop"),
        ]
        for dom, title, content, doc_type in docs_to_seed:
            doc_q = await db.execute(select(MemoryDocument).where(MemoryDocument.title == title))
            if not doc_q.scalar_one_or_none():
                md = MemoryDocument(domain=dom, title=title, content=content, doc_type=doc_type, metadata_json={"tier": "production"})
                db.add(md)
        await db.commit()

        # 9. Seed Active Anomalies
        anom_q = await db.execute(select(ObservationAnomaly).limit(1))
        if not anom_q.scalar_one_or_none():
            anoms = [
                ObservationAnomaly(
                    domain="sales",
                    entity_id="LEAD-9042",
                    severity="HIGH",
                    description="Enterprise lead Acme Corp ($48,000 ARR) dormant for 48.2 hours after demo.",
                    confidence=0.94,
                    recommended_action="send_followup_email",
                    is_resolved=False
                ),
                ObservationAnomaly(
                    domain="finance",
                    entity_id="INV-2026-8819",
                    severity="MEDIUM",
                    description="Subscription invoice for Initech Corp ($1,250.00) failed due to card decline.",
                    confidence=0.91,
                    recommended_action="retry_failed_invoice",
                    is_resolved=False
                ),
                ObservationAnomaly(
                    domain="support",
                    entity_id="TICK-4091",
                    severity="CRITICAL",
                    description="P1 SSO Login issue for Enterprise customer has 22 minutes remaining on SLA.",
                    confidence=0.98,
                    recommended_action="send_sla_escalation",
                    is_resolved=False
                ),
            ]
            for a in anoms:
                db.add(a)
            await db.commit()

        # 10. Seed Initial Audit Log Events
        aud_q = await db.execute(select(AuditEvent).limit(1))
        if not aud_q.scalar_one_or_none():
            audits = [
                AuditEvent(
                    actor_id="system_init",
                    actor_type="SYSTEM",
                    actor_email="system@ops.ai",
                    action="system.boot",
                    domain="operations",
                    resource_type="system",
                    resource_id="root",
                    result="SUCCESS",
                    risk_level="LOW",
                    trace_id="boot_trace_001",
                    details={"environment": "development", "version": "1.0.0"}
                ),
                AuditEvent(
                    actor_id="admin",
                    actor_type="USER",
                    actor_email="admin@ops.ai",
                    action="policy.activate",
                    domain="operations",
                    resource_type="policy_version",
                    resource_id="v1.8.0",
                    result="SUCCESS",
                    risk_level="MEDIUM",
                    trace_id="boot_trace_002",
                    details={"version": "v1.8.0"}
                ),
            ]
            for au in audits:
                db.add(au)
            await db.commit()

        logger.info("SeedService completed successfully with rich demo enterprise state.")
