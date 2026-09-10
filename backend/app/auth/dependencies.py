from typing import Optional, List, Callable
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token, check_user_permission, get_permissions_for_roles
from backend.app.core.exceptions import AuthenticationError, PermissionDeniedError
from backend.app.models.auth import User, UserRole

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e.message),
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    email: str = payload.get("email")
    if not user_id and not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload invalid (no subject or email)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    query = select(User).where((User.id == user_id) | (User.email == email))
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Returns the authenticated user if token is valid, otherwise returns None without throwing 401."""
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        return None

    user_id: str = payload.get("sub")
    email: str = payload.get("email")
    if not user_id and not email:
        return None

    query = select(User).where((User.id == user_id) | (User.email == email))
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        return None

    return user


def require_permission(permission_name: str) -> Callable:
    """Dependency factory checking that the authenticated user possesses the required permission."""
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_roles = [r.role_name for r in current_user.roles]
        if not check_user_permission(user_roles, permission_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required permission: '{permission_name}'",
            )
        return current_user

    return permission_checker
