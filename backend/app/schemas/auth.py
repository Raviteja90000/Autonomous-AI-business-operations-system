from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(..., min_length=8)
    role_names: List[str] = ["OPERATOR"]


class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    roles: List[str] = []
    permissions: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
