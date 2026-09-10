import time
from typing import Dict, Any, Tuple
from backend.app.agents.base import AgentBase
from backend.app.integrations.registry import integration_registry
from backend.app.core.exceptions import AppError
from backend.app.core.logging import logger


class ActuatorAgent(AgentBase):
    def __init__(self):
        super().__init__(
            agent_type="actuator",
            name="Action Actuator Agent",
            allowed_tools=["execute_crm", "execute_finance", "execute_support", "execute_email", "execute_marketing"],
            forbidden_tools=["modify_policy", "modify_guardrails", "read_auth_credentials"],
            prompt_version="v1.0.0"
        )

    async def execute(
        self,
        target_system: str,
        action_type: str,
        payload: Dict[str, Any],
        idempotency_key: str
    ) -> Dict[str, Any]:
        integration = integration_registry.get(target_system)
        if not integration:
            raise AppError(
                code="INTEGRATION_NOT_FOUND",
                message=f"No active integration found for target system '{target_system}'"
            )

        # 1. Pre-execution validation
        is_valid, val_msg = await integration.validate_action(action_type, payload)
        if not is_valid:
            raise AppError(
                code="ACTION_VALIDATION_FAILED",
                message=f"Action validation failed: {val_msg}"
            )

        # 2. Execution on target connector
        start_time = time.perf_counter()
        result = await integration.execute_action(action_type, payload)
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        logger.info(
            f"Actuator executed '{action_type}' on '{target_system}' in {latency_ms}ms (Idempotency: {idempotency_key})",
            extra={"event": "actuator_executed", "action_type": action_type, "target": target_system}
        )

        return {
            "status": "COMPLETED",
            "result_data": result,
            "side_effects": result.get("side_effects", []),
            "latency_ms": latency_ms,
        }

    async def rollback(
        self,
        target_system: str,
        action_type: str,
        rollback_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        integration = integration_registry.get(target_system)
        if not integration:
            raise AppError(
                code="INTEGRATION_NOT_FOUND",
                message=f"No integration found for '{target_system}' to rollback action."
            )

        result = await integration.rollback_action(action_type, rollback_payload)
        return {
            "status": result.get("status", "ROLLED_BACK"),
            "message": result.get("message", "Rollback executed."),
            "result_data": result
        }
