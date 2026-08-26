"""Admin IAM request and response schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class AdminUserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None
    organization_id: int
    roles: list[str] = Field(default_factory=list)


class AdminUserCreateResponse(BaseModel):
    id: int
    email: str
    name: str | None = None
    account_status: str
    organization_id: int
    roles: list[str]


class AdminUserStatusUpdateRequest(BaseModel):
    organization_id: int
    account_status: str


class AdminUserStatusResponse(BaseModel):
    id: int
    email: str
    name: str | None = None
    account_status: str


class AdminMemberRolesUpdateRequest(BaseModel):
    roles: list[str]


class AdminMemberRolesResponse(BaseModel):
    user_id: int
    organization_id: int
    roles: list[str]


class AdminMemberRemoveResponse(BaseModel):
    id: int
    user_id: int
    organization_id: int
    status: str
    removed_at: datetime | None = None
    removed_by: int | None = None


class AdminOrgMemberRead(BaseModel):
    user_id: int
    email: str
    name: str | None = None
    account_status: str
    organization_id: int
    membership_status: str
    roles: list[str]
    joined_at: datetime | None = None
    removed_at: datetime | None = None
