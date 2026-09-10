from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.services.auth_service import AuthService
from backend.app.schemas.auth import UserLoginRequest, UserRegisterRequest, TokenResponse, UserResponse
from backend.app.core.security import create_access_token, get_permissions_for_roles
from backend.app.auth.dependencies import get_current_user
from backend.app.models.auth import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.authenticate_user(db, credentials.email, credentials.password)
    role_names = [r.role_name for r in user.roles]
    perms = list(get_permissions_for_roles(role_names))

    access_token = create_access_token(data={"sub": user.id, "email": user.email, "roles": role_names})
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        roles=role_names,
        permissions=perms,
        created_at=user.created_at,
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=28800,
        user=user_resp
    )


@router.post("/register", response_model=UserResponse)
async def register(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.register_user(
        db, email=req.email, full_name=req.full_name, password=req.password, role_names=req.role_names
    )
    role_names = [r.role_name for r in user.roles]
    perms = list(get_permissions_for_roles(role_names))
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        roles=role_names,
        permissions=perms,
        created_at=user.created_at,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    role_names = [r.role_name for r in current_user.roles]
    perms = list(get_permissions_for_roles(role_names))
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        roles=role_names,
        permissions=perms,
        created_at=current_user.created_at,
    )
