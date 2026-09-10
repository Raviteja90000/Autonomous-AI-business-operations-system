from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.core.database import get_db
from backend.app.models.integration import Integration
from backend.app.schemas.integration import IntegrationResponse, IntegrationTestResponse
from backend.app.integrations.registry import integration_registry
from backend.app.auth.dependencies import require_permission
from backend.app.models.auth import User
from backend.app.core.exceptions import NotFoundError

router = APIRouter(prefix="/integrations", tags=["Integrations"])


@router.get("", response_model=List[IntegrationResponse])
async def list_integrations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("integration.read"))
):
    stmt = select(Integration).order_by(desc(Integration.created_at))
    res = await db.execute(stmt)
    integrations = list(res.scalars().all())
    for integ in integrations:
        conn = integration_registry.get(integ.connector_type)
        if conn:
            integ.is_mock = conn.is_mock
            integ.name = conn.name
    return integrations


from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class SendTestEmailRequest(BaseModel):
    recipient: Optional[str] = Field(default="ravitejatalapaneni@gmail.com")
    subject: Optional[str] = Field(default="⚡ Live Test from Autonomous AI Business Operations")
    message: Optional[str] = Field(default="Live email gateway verification test dispatched to your inbox.")


@router.post("/{integration_id}/test", response_model=IntegrationTestResponse)
async def test_integration_connection(
    integration_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("integration.manage"))
):
    stmt = select(Integration).where(Integration.id == integration_id)
    res = await db.execute(stmt)
    integ = res.scalar_one_or_none()
    if not integ:
        raise NotFoundError("Integration", integration_id)

    conn = integration_registry.get(integ.connector_type)
    if not conn:
        return IntegrationTestResponse(
            integration_id=integ.id,
            status="DEGRADED",
            success=False,
            latency_ms=0.0,
            message=f"Connector '{integ.connector_type}' is not registered."
        )

    test_res = await conn.test_connection()
    return IntegrationTestResponse(
        integration_id=integ.id,
        status=test_res.get("status", "CONNECTED"),
        success=test_res.get("success", True),
        latency_ms=test_res.get("latency_ms", 30.0),
        message=test_res.get("message", "Connection test successful."),
        details=test_res
    )


@router.post("/{integration_id}/send-test")
async def send_integration_test_action(
    integration_id: str,
    req: Optional[SendTestEmailRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("integration.manage"))
):
    stmt = select(Integration).where(Integration.id == integration_id)
    res = await db.execute(stmt)
    integ = res.scalar_one_or_none()
    if not integ:
        conn = integration_registry.get(integration_id)
        if not conn:
            raise NotFoundError("Integration", integration_id)
    else:
        conn = integration_registry.get(integ.connector_type)
        if not conn:
            raise NotFoundError("Integration", integration_id)

    recipient = (req.recipient if req else None) or "ravitejatalapaneni@gmail.com"
    subject = (req.subject if req else None) or "⚡ Live Test from Autonomous AI Business Operations"
    message = (req.message if req else None) or (
        "Hello Ravi! This is a live email verification dispatched from your Autonomous AI Business Operations Gateway. "
        "The email connector is operating live and routing payloads directly to your Gmail inbox."
    )

    exec_result = await conn.execute_action(
        action_type="send_test_email",
        payload={
            "recipient": recipient,
            "subject": subject,
            "body": message
        }
    )

    return {
        "status": exec_result.get("status", "SUCCESS"),
        "provider": exec_result.get("provider", "resend"),
        "message_id": exec_result.get("message_id"),
        "recipient": exec_result.get("recipient", recipient),
        "intended_recipient": exec_result.get("intended_recipient", recipient),
        "details": exec_result
    }

