"""
Authentication Schemas - API request/response contract

These are used for FastAPI request validation and response serialization
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ============ Registration ============

class UserRegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(min_length=8, description="At least 8 characters, must contain uppercase letters and numbers")
    name: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123",
                "name": "John Doe"
            }
        }


class UserRegisterResponse(BaseModel):
    """Registration response"""
    user_id: int
    email: str
    message: str


# ============ Login ============

class UserLoginRequest(BaseModel):
    """Login request"""
    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123"
            }
        }


class UserRead(BaseModel):
    """User read response (does NOT include password_hash)"""
    user_id: int
    email: str
    name: Optional[str] = None
    account_status: str
    two_factor_enabled: bool
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class OrgContextRead(BaseModel):
    """User permission context in organization"""
    organization_id: int
    organization_name: str
    organization_slug: str
    organization_status: str
    membership_status: str
    roles: list[str]  # [admin, reviewer, ...]
    is_admin: bool
    is_owner: bool = Field(default=False)
    members_count: int = Field(default=0)
    policy: dict = Field(default_factory=dict)  # Governance configuration
    
    class Config:
        from_attributes = True


class UserLoginResponse(BaseModel):
    """Login response"""
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    organizations: list[OrgContextRead]
    message: str


# ============ Token Related ============

class TokenRefreshRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Refresh token response"""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT Token payload (internal use)"""
    sub: int  # user_id
    email: str
    orgs: list[dict]  # org contexts
    exp: datetime
