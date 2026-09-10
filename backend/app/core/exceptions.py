from typing import Optional, Any, Dict


class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.request_id = request_id


class AuthenticationError(AppError):
    def __init__(self, message: str = "Invalid authentication credentials"):
        super().__init__(
            code="AUTHENTICATION_FAILED",
            message=message,
            status_code=401,
        )


class PermissionDeniedError(AppError):
    def __init__(self, message: str = "Permission denied for this operation"):
        super().__init__(
            code="PERMISSION_DENIED",
            message=message,
            status_code=403,
        )


class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=f"{resource} with id '{resource_id}' was not found",
            status_code=404,
            details={"resource": resource, "resource_id": resource_id},
        )


class GuardrailBlockError(AppError):
    def __init__(self, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="GUARDRAIL_BLOCKED",
            message=f"Action blocked by deterministic guardrails: {reason}",
            status_code=422,
            details=details,
        )


class KillSwitchActiveError(AppError):
    def __init__(self, scope: str = "GLOBAL", target: Optional[str] = None):
        super().__init__(
            code="KILL_SWITCH_ACTIVE",
            message=f"Operation halted because {scope} kill switch is active (target: {target or 'all'})",
            status_code=503,
            details={"scope": scope, "target": target},
        )


class IdempotencyConflictError(AppError):
    def __init__(self, idempotency_key: str):
        super().__init__(
            code="IDEMPOTENCY_CONFLICT",
            message=f"Action with idempotency key '{idempotency_key}' is already executed or in-progress",
            status_code=409,
            details={"idempotency_key": idempotency_key},
        )
