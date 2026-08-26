"""
Members Schemas - Member and role management API contract
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# ============ Invite Member ============

class MemberInviteRequest(BaseModel):
    """Member invite request"""
    email: EmailStr

    class Config:
        json_schema_extra = {
            "example": {
                "email": "newmember@company.com"
            }
        }


class MemberInviteResponse(BaseModel):
    """Invitation response"""
    member_id: int
    user_id: int
    user_email: str
    organization_id: int
    status: str  # "invited"
    invited_at: datetime
    message: str


# ============ Member List ============

class MemberRead(BaseModel):
    """Member read"""
    id: int
    user_id: int
    user_email: str
    status: str  # invited | active | restricted | removed
    roles: list[str]
    is_admin: bool
    invited_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    invited_by: Optional[int] = None


class MemberListResponse(BaseModel):
    """Member list response"""
    organization_id: int
    total_count: int
    members: list[MemberRead]


# ============ Accept Invitation ============

class InvitationAcceptResponse(BaseModel):
    """Accept invitation response"""
    member_id: int
    status: str  # "active"
    accepted_at: datetime
    message: str


# ============ List Pending Invitations ============

class PendingInvitationRead(BaseModel):
    """Pending invitation read"""
    id: int
    organization_id: int
    organization_name: str
    organization_slug: str
    invited_email: str
    invited_at: datetime
    expires_at: Optional[datetime] = None
    status: str  # "pending"


class PendingInvitationListResponse(BaseModel):
    """Pending invitations list response"""
    total_count: int
    invitations: list[PendingInvitationRead]


# ============ Role Management ============

class RoleAssignRequest(BaseModel):
    """Assign role request"""
    role_key: str  # admin, task_owner, annotator, reviewer, etc

    class Config:
        json_schema_extra = {
            "example": {
                "role_key": "annotator"
            }
        }


class RoleAssignResponse(BaseModel):
    """Assign role response"""
    role_assignment_id: int
    user_id: int
    organization_id: int
    role_key: str
    granted_at: datetime
    message: str


class RoleRead(BaseModel):
    """Role read"""
    id: int
    user_id: int
    role_key: str
    role_name: str
    scope: str  # organization | project
    granted_at: datetime
    granted_by: int


class RoleRevokeResponse(BaseModel):
    """Revoke role response"""
    role_id: int
    revoked_at: datetime
    message: str


class UserRolesRead(BaseModel):
    """User's all roles"""
    user_id: int
    user_email: str
    roles: list[RoleRead]
