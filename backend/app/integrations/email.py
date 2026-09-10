import time
from typing import Dict, Any, Tuple
import httpx
from backend.app.integrations.base import BaseIntegration
from backend.app.core.config import settings
from backend.app.core.logging import logger


class EmailIntegration(BaseIntegration):
    def __init__(self, is_mock: bool = True):
        if settings.EMAIL_CONNECTOR_TYPE == "resend" or settings.RESEND_API_KEY:
            name = "Resend Email Gateway"
        elif settings.EMAIL_CONNECTOR_TYPE == "sendgrid" or settings.SENDGRID_API_KEY:
            name = "SendGrid Communications"
        else:
            name = "Email Communications Gateway"
        super().__init__(name=name, domain="sales", connector_type="email", is_mock=is_mock)

    async def fetch_observations(self) -> Dict[str, Any]:
        return {
            "source": "email_gateway",
            "entities": [],
            "metrics": {
                "delivery_rate": 0.994,
                "open_rate": 0.44,
                "bounce_rate": 0.003
            }
        }

    async def validate_action(self, action_type: str, payload: Dict[str, Any]) -> Tuple[bool, str]:
        if "recipient" not in payload or "subject" not in payload:
            return False, "Missing 'recipient' or 'subject' in email payload"
        return True, "Valid email payload"

    async def execute_action(self, action_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        recipient = payload.get("recipient") or getattr(settings, "RESEND_TEST_RECIPIENT", "ravitejatalapaneni@gmail.com")
        subject = payload.get("subject", "AI Business Ops Notification")
        body = payload.get("body") or payload.get("message") or payload.get("text", "")
        
        # If body is missing, generate an informative default message
        if not body and not payload.get("body_html"):
            lead_info = f" for entity/lead {payload.get('lead_id')}" if payload.get("lead_id") else ""
            body = (
                f"Autonomous Business Operations Manager has executed action '{action_type}'{lead_info}.\n\n"
                f"This notification was triggered automatically by an ODAEA operational cycle following "
                f"anomaly detection, critic verification, and policy guardrail validation."
            )

        html_body = payload.get("body_html") or f"<p style='font-size: 14px; line-height: 1.6; color: #1C1917;'>{body}</p>"

        # 1. Check if Live Resend is configured
        if not self.is_mock and settings.RESEND_API_KEY:
            try:
                from_email = settings.RESEND_FROM_EMAIL or "onboarding@resend.dev"
                test_inbox = getattr(settings, "RESEND_TEST_RECIPIENT", "ravitejatalapaneni@gmail.com") or "ravitejatalapaneni@gmail.com"
                route_to_test = (
                    getattr(settings, "RESEND_ROUTE_TO_TEST_INBOX", True)
                    or "onboarding@resend.dev" in from_email
                    or not recipient
                    or str(recipient).endswith(".example")
                    or "acmecorp" in str(recipient).lower()
                )
                
                # Resend sandbox (onboarding@resend.dev) strictly requires delivering to the verified account owner.
                # If using onboarding domain or recipient is a test domain (.example, acmecorp), route to test inbox.
                effective_recipient = test_inbox if route_to_test else recipient
                if route_to_test and recipient and recipient.lower() != test_inbox.lower():
                    subject = f"[Auren Ops -> {recipient}] {subject}"
                elif not subject.startswith("[Auren Ops]"):
                    subject = f"[Auren Ops] {subject}"

                html_body = (
                    f"<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; padding: 16px 20px; background-color: #FAF8F5; "
                    f"border: 1px solid #E2DAD0; border-left: 4px solid #8E5633; border-radius: 8px; margin-bottom: 20px; font-size: 13px; color: #1C1917;'>"
                    f"<p style='margin: 0 0 8px 0; font-weight: bold; color: #8E5633; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;'>⚡ Autonomous AI Business Operations — Live Gateway Delivery</p>"
                    f"<p style='margin: 0 0 4px 0;'><strong>Target Enterprise Recipient:</strong> <code>{recipient}</code></p>"
                    f"<p style='margin: 0 0 4px 0;'><strong>Action Type:</strong> <code>{action_type}</code></p>"
                    f"<p style='margin: 0;'><strong>Delivered To:</strong> <code>{effective_recipient}</code> (Live Verified Inbox)</p>"
                    f"</div>"
                    f"<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; color: #1C1917; line-height: 1.6; font-size: 14px;'>"
                    f"{html_body}"
                    f"</div>"
                )

                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.resend.com/emails",
                        headers={
                            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "from": from_email,
                            "to": [effective_recipient],
                            "subject": subject,
                            "html": html_body
                        }
                    )
                    if resp.is_success:
                        res_data = resp.json()
                        logger.info(f"Live email sent via Resend: id={res_data.get('id')} to={effective_recipient} (target={recipient})")
                        return {
                            "status": "SUCCESS",
                            "provider": "resend",
                            "message_id": res_data.get("id"),
                            "action_type": action_type,
                            "recipient": effective_recipient,
                            "intended_recipient": recipient,
                            "side_effects": [
                                {
                                    "entity_type": "email_message",
                                    "entity_id": effective_recipient,
                                    "before": {"sent": False},
                                    "after": {"sent": True, "provider": "resend", "id": res_data.get("id"), "intended": recipient}
                                }
                            ]
                        }
                    else:
                        logger.error(f"Resend API error: {resp.status_code} - {resp.text}")
                        return {
                            "status": "FAILED",
                            "provider": "resend",
                            "error": resp.text,
                            "recipient": effective_recipient,
                            "intended_recipient": recipient
                        }
            except Exception as e:
                logger.error(f"Exception calling Resend API: {e}")
                return {
                    "status": "FAILED",
                    "provider": "resend",
                    "error": str(e),
                    "recipient": recipient
                }

        # 2. Mock Fallback
        return {
            "status": "SUCCESS",
            "provider": "mock",
            "message_id": f"msg_{int(time.time())}@ops.local",
            "action_type": action_type,
            "recipient": recipient,
            "side_effects": [
                {
                    "entity_type": "email_message",
                    "entity_id": recipient,
                    "before": {"sent": False},
                    "after": {"sent": True, "timestamp": time.time(), "simulated": True}
                }
            ]
        }

    async def rollback_action(self, action_type: str, rollback_payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "IRREVERSIBLE",
            "message": "Sent emails cannot be un-delivered. Compensating follow-up note queued if necessary."
        }

    async def test_connection(self) -> Dict[str, Any]:
        if settings.RESEND_API_KEY:
            try:
                start_time = time.perf_counter()
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.get(
                        "https://api.resend.com/api-keys",
                        headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"}
                    )
                    latency = round((time.perf_counter() - start_time) * 1000, 1)
                    # Resend returns 200 for full keys, or 401 with 'restricted to only send emails' for send-only keys
                    if resp.is_success or "send emails" in resp.text:
                        return {
                            "success": True,
                            "latency_ms": latency,
                            "status": "CONNECTED",
                            "message": f"Resend API connected & authenticated successfully (Ready to send). Roundtrip: {latency}ms"
                        }
                    else:
                        return {
                            "success": False,
                            "latency_ms": latency,
                            "status": "AUTH_FAILED",
                            "message": f"Resend authentication failed: {resp.text}"
                        }
            except Exception as e:
                return {
                    "success": False,
                    "status": "ERROR",
                    "message": f"Resend connection failed: {e}"
                }

        return {
            "success": True,
            "latency_ms": 19.8,
            "status": "CONNECTED",
            "message": "Email Gateway ready (Mock Mode)."
        }
