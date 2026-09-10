import copy
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm.attributes import flag_modified
from backend.app.models.policy import PolicyVersion, PolicyUpdate
from backend.app.models.audit import AuditEvent
from backend.app.core.exceptions import NotFoundError, AppError


class PolicyService:
    @classmethod
    async def list_versions(cls, db: AsyncSession) -> List[PolicyVersion]:
        stmt = select(PolicyVersion).order_by(desc(PolicyVersion.created_at))
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def get_active(cls, db: AsyncSession) -> Optional[PolicyVersion]:
        stmt = select(PolicyVersion).where(PolicyVersion.is_active == True).limit(1)
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @classmethod
    async def activate_version(cls, db: AsyncSession, version_id: str, approved_by: str) -> PolicyVersion:
        stmt = select(PolicyVersion).where(PolicyVersion.id == version_id)
        res = await db.execute(stmt)
        pv = res.scalar_one_or_none()
        if not pv:
            raise NotFoundError("PolicyVersion", version_id)

        # Deactivate all others
        all_pv_res = await db.execute(select(PolicyVersion))
        for p in all_pv_res.scalars().all():
            p.is_active = False

        pv.is_active = True
        pv.approved_by = approved_by
        await db.commit()
        await db.refresh(pv)
        return pv

    @classmethod
    async def list_updates(cls, db: AsyncSession, deduplicate: bool = True) -> List[PolicyUpdate]:
        stmt = select(PolicyUpdate).order_by(desc(PolicyUpdate.created_at))
        res = await db.execute(stmt)
        all_updates = list(res.scalars().all())
        
        if not deduplicate:
            for upd in all_updates:
                setattr(upd, "occurrence_count", 1)
            return all_updates

        # Count occurrences for each unique (rationale, proposed_changes) key
        counts: Dict[Any, int] = {}
        for upd in all_updates:
            changes_str = str(sorted(upd.proposed_changes.items())) if isinstance(upd.proposed_changes, dict) else str(upd.proposed_changes)
            dedup_key = (upd.rationale.strip(), changes_str)
            counts[dedup_key] = counts.get(dedup_key, 0) + 1

        seen_keys = set()
        unique_updates: List[PolicyUpdate] = []
        for upd in all_updates:
            changes_str = str(sorted(upd.proposed_changes.items())) if isinstance(upd.proposed_changes, dict) else str(upd.proposed_changes)
            dedup_key = (upd.rationale.strip(), changes_str)
            if dedup_key not in seen_keys:
                seen_keys.add(dedup_key)
                setattr(upd, "occurrence_count", counts[dedup_key])
                unique_updates.append(upd)
        
        return unique_updates

    @classmethod
    async def decide_update(
        cls,
        db: AsyncSession,
        update_id: str,
        action: str,
        approved_by: str = "admin@ops.ai"
    ) -> PolicyUpdate:
        stmt = select(PolicyUpdate).where(PolicyUpdate.id == update_id)
        res = await db.execute(stmt)
        pu = res.scalar_one_or_none()
        if not pu:
            raise NotFoundError("PolicyUpdate", update_id)

        normalized_action = action.upper().strip()
        if normalized_action in ["ACCEPT", "APPROVE", "ACCEPTED"]:
            new_status = "ACCEPTED"
        elif normalized_action in ["DISMISS", "DISMISSED"]:
            new_status = "DISMISSED"
        else:
            new_status = "REJECTED"

        pu.status = new_status

        # If ACCEPTED, apply the changes directly to the active PolicyVersion
        if new_status == "ACCEPTED":
            active_policy = await cls.get_active(db)
            if active_policy:
                rules_json = copy.deepcopy(active_policy.rules_json or {})
                changes = pu.proposed_changes if isinstance(pu.proposed_changes, dict) else {}
                domain = changes.get("domain")
                action_name = changes.get("action")

                if domain:
                    domain_rules = rules_json.setdefault("domain_rules", {}).setdefault(domain.lower(), {})
                    
                    # Ensure action is in allowed_autonomous_actions if specified
                    if action_name:
                        allowed = domain_rules.setdefault("allowed_autonomous_actions", [])
                        if action_name not in allowed:
                            allowed.append(action_name)
                            
                        # Update action confidence prior
                        priors = domain_rules.setdefault("action_confidence_priors", {})
                        delta_raw = str(changes.get("confidence_prior_delta", "0.02")).replace("+", "")
                        try:
                            delta_val = float(delta_raw)
                        except ValueError:
                            delta_val = 0.02
                        current_prior = priors.get(action_name, rules_json.get("global_limits", {}).get("min_confidence_threshold", 0.85))
                        priors[action_name] = round(min(0.99, current_prior + delta_val), 4)

                    if "recommended_tier" in changes:
                        try:
                            domain_rules["autonomy_tier"] = int(changes["recommended_tier"])
                        except (ValueError, TypeError):
                            pass

                if "min_confidence_threshold" in changes:
                    try:
                        rules_json.setdefault("global_limits", {})["min_confidence_threshold"] = float(changes["min_confidence_threshold"])
                    except (ValueError, TypeError):
                        pass

                # Record in applied_adaptations history inside rules_json
                applied_list = rules_json.setdefault("applied_adaptations", [])
                applied_list.append({
                    "update_id": pu.id,
                    "rationale": pu.rationale,
                    "proposed_changes": changes,
                    "applied_at": datetime.now(timezone.utc).isoformat(),
                    "approved_by": approved_by
                })

                active_policy.rules_json = rules_json
                flag_modified(active_policy, "rules_json")

                # Append adaptation note to rules_yaml
                now_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
                yaml_note = (
                    f"\n# --- Dynamic Adapter Tuning Applied ({now_str}) ---\n"
                    f"# Approved By: {approved_by}\n"
                    f"# Rationale: {pu.rationale}\n"
                    f"# Changes: {changes}\n"
                )
                active_policy.rules_yaml = (active_policy.rules_yaml or "").rstrip() + yaml_note
                active_policy.approved_by = approved_by

                # Log AuditEvent for accepted policy adaptation
                audit = AuditEvent(
                    actor_id=approved_by,
                    actor_type="USER",
                    actor_email=approved_by,
                    action="policy.adaptation.accept",
                    domain=domain or "governance",
                    resource_type="policy_update",
                    resource_id=pu.id,
                    result="SUCCESS",
                    risk_level="MEDIUM",
                    trace_id=pu.id,
                    details={
                        "policy_version": active_policy.version_number,
                        "rationale": pu.rationale,
                        "proposed_changes": changes,
                        "applied_status": new_status,
                    }
                )
                db.add(audit)
        else:
            # Audit log for dismissal/rejection
            changes = pu.proposed_changes if isinstance(pu.proposed_changes, dict) else {}
            domain = changes.get("domain")
            audit = AuditEvent(
                actor_id=approved_by,
                actor_type="USER",
                actor_email=approved_by,
                action=f"policy.adaptation.{new_status.lower()}",
                domain=domain or "governance",
                resource_type="policy_update",
                resource_id=pu.id,
                result="SUCCESS",
                risk_level="LOW",
                trace_id=pu.id,
                details={
                    "rationale": pu.rationale,
                    "proposed_changes": changes,
                    "applied_status": new_status,
                }
            )
            db.add(audit)

        # Cascade status to all duplicate pending proposals with identical rationale & changes
        changes_str = str(sorted(pu.proposed_changes.items())) if isinstance(pu.proposed_changes, dict) else str(pu.proposed_changes)
        all_updates_res = await db.execute(select(PolicyUpdate))
        for other_upd in all_updates_res.scalars().all():
            other_changes_str = str(sorted(other_upd.proposed_changes.items())) if isinstance(other_upd.proposed_changes, dict) else str(other_upd.proposed_changes)
            if other_upd.rationale.strip() == pu.rationale.strip() and other_changes_str == changes_str:
                other_upd.status = new_status

        await db.commit()
        await db.refresh(pu)
        setattr(pu, "occurrence_count", 1)
        return pu

