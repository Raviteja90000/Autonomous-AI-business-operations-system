import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Set
from jose import JWTError, jwt
import bcrypt
from backend.app.core.config import settings
from backend.app.core.exceptions import AuthenticationError, PermissionDeniedError


# Pre-defined RBAC Role Permissions Matrix
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "ADMIN": {
        "dashboard.read",
        "cycle.read", "cycle.trigger", "cycle.cancel",
        "observation.read",
        "decision.read",
        "decision.approve", "decision.reject",
        "action.read", "action.execute", "action.rollback",
        "evaluation.read", "evaluation.trigger",
        "agent.read", "agent.configure",
        "memory.read", "memory.write",
        "policy.read", "policy.update",
        "integration.read", "integration.manage",
        "audit.read", "audit.export",
        "system.read", "system.kill_switch", "system.configure",
    },
    "OPERATOR": {
        "dashboard.read",
        "cycle.read", "cycle.trigger",
        "observation.read",
        "decision.read",
        "decision.approve", "decision.reject",
        "action.read", "action.execute", "action.rollback",
        "evaluation.read", "evaluation.trigger",
        "agent.read",
        "memory.read",
        "policy.read", "policy.update",
        "integration.read",
        "audit.read",
        "system.read",
    },
    "APPROVER": {
        "dashboard.read",
        "cycle.read",
        "observation.read",
        "decision.read",
        "decision.approve", "decision.reject",
        "action.read",
        "evaluation.read",
        "agent.read",
        "policy.read", "policy.update",
        "audit.read",
        "system.read",
    },
    "AUDITOR": {
        "dashboard.read",
        "cycle.read",
        "observation.read",
        "decision.read",
        "action.read",
        "evaluation.read",
        "agent.read",
        "memory.read",
        "policy.read",
        "integration.read",
        "audit.read", "audit.export",
        "system.read",
    },
    "VIEWER": {
        "dashboard.read",
        "cycle.read",
        "observation.read",
        "decision.read",
        "action.read",
        "evaluation.read",
        "agent.read",
        "system.read",
    },
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise AuthenticationError(f"Invalid or expired token: {str(e)}")


def get_permissions_for_roles(roles: List[str]) -> Set[str]:
    """Aggregates all granted permissions across assigned user roles."""
    permissions: Set[str] = set()
    for role in roles:
        role_upper = role.upper()
        if role_upper in ROLE_PERMISSIONS:
            permissions.update(ROLE_PERMISSIONS[role_upper])
    return permissions


def check_user_permission(user_roles: List[str], required_permission: str) -> bool:
    granted = get_permissions_for_roles(user_roles)
    return required_permission in granted
