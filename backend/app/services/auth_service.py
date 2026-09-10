from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.auth import User, Role, UserRole
from backend.app.core.security import get_password_hash, verify_password, create_access_token, get_permissions_for_roles
from backend.app.core.exceptions import AuthenticationError, AppError


class AuthService:
    @classmethod
    async def authenticate_user(cls, db: AsyncSession, email: str, password: str) -> User:
        query = select(User).where(User.email == email.lower())
        res = await db.execute(query)
        user = res.scalar_one_or_none()

        if not user or not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")
        
        if not user.is_active:
            raise AuthenticationError("User account is inactive")

        return user

    @classmethod
    async def register_user(
        cls,
        db: AsyncSession,
        email: str,
        full_name: str,
        password: str,
        role_names: List[str] = ["OPERATOR"],
        organization_id: Optional[str] = None
    ) -> User:
        existing = await db.execute(select(User).where(User.email == email.lower()))
        if existing.scalar_one_or_none():
            raise AppError(code="USER_EXISTS", message=f"User with email '{email}' already exists", status_code=400)

        hashed = get_password_hash(password)
        user = User(
            email=email.lower(),
            full_name=full_name,
            hashed_password=hashed,
            is_active=True,
            organization_id=organization_id,
        )
        db.add(user)
        await db.flush()

        for r_name in role_names:
            role_q = await db.execute(select(Role).where(Role.name == r_name.upper()))
            role = role_q.scalar_one_or_none()
            if not role:
                role = Role(name=r_name.upper(), description=f"{r_name.title()} Role", permissions=[])
                db.add(role)
                await db.flush()

            ur = UserRole(user_id=user.id, role_id=role.id, role_name=role.name)
            db.add(ur)

        await db.commit()
        await db.refresh(user)
        return user
