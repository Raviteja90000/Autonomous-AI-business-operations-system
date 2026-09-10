from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.models.approval import ApprovalRequest, ApprovalEvent
from backend.app.models.cycle import ODAEACycle
from backend.app.models.decision import DecisionRecord, DecisionAction
from backend.app.models.audit import AuditEvent
from backend.app.workflow.state_machine import ODAEAFlowEngine
from backend.app.core.exceptions import NotFoundError, AppError
from backend.app.core.websocket import ws_manager
from backend.app.core.telemetry import metrics
from backend.app.core.logging import logger


class ApprovalService:
    @classmethod
    async def list_pending(cls, db: AsyncSession, domain: Optional[str] = None) -> List[ApprovalRequest]:
        stmt = select(ApprovalRequest).where(ApprovalRequest.status == "PENDING")
        if domain:
            stmt = stmt.where(ApprovalRequest.domain == domain.lower())
        stmt = stmt.order_by(ApprovalRequest.created_at.desc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def get_by_id(cls, db: AsyncSession, approval_id: str) -> ApprovalRequest:
        stmt = select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
        res = await db.execute(stmt)
        req = res.scalar_one_or_none()
        if not req:
            raise NotFoundError("ApprovalRequest", approval_id)
        return req

    @classmethod
    async def decide(
        cls,
        db: AsyncSession,
        approval_id: str,
        reviewer_id: Optional[str],
        reviewer_email: str,
        action: str,  # APPROVE | REJECT | REQUEST_CHANGES
        notes: Optional[str] = None
    ) -> ApprovalRequest:
        req = await cls.get_by_id(db, approval_id)
        if req.status != "PENDING":
            raise AppError(
                code="ALREADY_DECIDED",
                message=f"Approval request '{approval_id}' has already been processed with status '{req.status}'"
            )

        event = ApprovalEvent(
            approval_request_id=req.id,
            reviewer_id=reviewer_id,
            reviewer_email=reviewer_email,
            action=action.upper(),
            notes=notes,
            decided_at=datetime.now(timezone.utc)
        )
        db.add(event)

        # Update Request status
        if action.upper() == "APPROVE":
            req.status = "APPROVED"
            metrics.increment("approvals_granted")
        elif action.upper() == "REJECT":
            req.status = "REJECTED"
            metrics.increment("approvals_rejected")
        else:
            req.status = "CHANGES_REQUESTED"

        # Log Audit Event
        audit = AuditEvent(
            actor_id=reviewer_id or "user",
            actor_type="USER",
            actor_email=reviewer_email,
            action=f"approval.{action.lower()}",
            domain=req.domain,
            resource_type="approval_request",
            resource_id=req.id,
            result="SUCCESS",
            risk_level=req.risk_level,
            trace_id=req.cycle_id,
            details={"notes": notes, "decision_id": req.decision_id}
        )
        db.add(audit)
        await db.commit()

        # If Approved, resume execution of cycle
        if action.upper() == "APPROVE":
            cycle_stmt = select(ODAEACycle).where(ODAEACycle.id == req.cycle_id)
            c_res = await db.execute(cycle_stmt)
            cycle = c_res.scalar_one_or_none()

            dec_stmt = select(DecisionRecord).where(DecisionRecord.id == req.decision_id)
            d_res = await db.execute(dec_stmt)
            decision = d_res.scalar_one_or_none()

            if cycle and decision:
                act_stmt = select(DecisionAction).where(DecisionAction.decision_id == decision.id)
                act_res = await db.execute(act_stmt)
                actions = list(act_res.scalars().all())

                tier = cycle.metadata_json.get("autonomy_tier", 2)
                engine = ODAEAFlowEngine(db)
                await engine._resume_execution_after_approval(cycle, decision, actions, tier)

        elif action.upper() == "REJECT":
            cycle_stmt = select(ODAEACycle).where(ODAEACycle.id == req.cycle_id)
            c_res = await db.execute(cycle_stmt)
            cycle = c_res.scalar_one_or_none()
            if cycle:
                cycle.status = "CANCELLED"
                cycle.current_stage = "COMPLETED"
                cycle.completed_at = datetime.now(timezone.utc)
                await db.commit()

        await ws_manager.broadcast("approval_decided", {
            "approval_id": req.id,
            "status": req.status,
            "reviewer": reviewer_email,
            "cycle_id": req.cycle_id
        }, correlation_id=req.cycle_id)

        await db.refresh(req)
        return req
