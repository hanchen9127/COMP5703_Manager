"""
Admin System Models - Internal data models representing the complete system state

These models are used for internal services and databases, containing all fields (including id, password_hash, revoked_at, etc.)
"""

from datetime import UTC, datetime
from enum import StrEnum
from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(UTC)


# ============ Enums ============

class AccountStatus(StrEnum):
    """User account status"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    RESTRICTED = "restricted"


class OrganizationUserStatus(StrEnum):
    """User membership status in organization"""
    INVITED = "invited"
    ACTIVE = "active"
    RESTRICTED = "restricted"
    REMOVED = "removed"


class RoleKey(StrEnum):
    """Role identifier"""
    ADMIN = "admin"
    TASK_OWNER = "task_owner"
    ANNOTATOR = "annotator"
    REVIEWER = "reviewer"
    ARBITRATOR = "arbitrator"
    DISPUTE_PARTICIPANT = "dispute_participant"


class RoleScope(StrEnum):
    """Role scope"""
    ORGANIZATION = "organization"
    PROJECT = "project"


class DisputeEscalationGate(StrEnum):
    """Dispute escalation policy"""
    NONE = "none"
    REQUIRED = "required"
    MANDATORY = "mandatory"


# ============ Admin Models ============

class User(BaseModel):
    """Global user identity"""
    id: int
    email: str
    password_hash: str  # CRITICAL: Never include in API response schema
    name: str | None = None  # User's display name
    account_status: AccountStatus = AccountStatus.ACTIVE
    two_factor_enabled: bool = False
    last_login_at: datetime | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class OrganizationUser(BaseModel):
    """User membership in organization"""
    id: int
    user_id: int
    organization_id: int
    status: OrganizationUserStatus = OrganizationUserStatus.INVITED
    invited_at: datetime | None = None
    invited_by: int | None = None
    accepted_at: datetime | None = None
    removed_at: datetime | None = None
    removed_by: int | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class RoleAssignment(BaseModel):
    """User role assignment"""
    id: int
    user_id: int
    organization_id: int
    project_id: int | None = None  # NULL when organization-level role
    role_key: RoleKey
    role_name: str  # Display name, e.g. "Administrator"
    scope: RoleScope
    granted_at: datetime = Field(default_factory=utc_now)
    granted_by: int
    revoked_at: datetime | None = None
    revoked_by: int | None = None
    change_reason: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Organization(BaseModel):
    """Tenant organization"""
    id: int
    name: str
    slug: str  # URL-friendly identifier
    status: str = "active"  # active, suspended, archived
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class OrganizationPolicy(BaseModel):
    """Organization-level governance policy configuration"""
    id: int
    organization_id: int
    # Membership Policy
    membership_approval_required: bool = False
    # Review Policy
    review_dual_sign_off: bool = False
    review_auto_escalate_disagreement: bool = False
    # Dispute Policy
    dispute_escalation_gate: DisputeEscalationGate = DisputeEscalationGate.NONE
    dispute_escalation_threshold: int = 100
    # Export Policy
    export_provenance_required: bool = True
    export_retention_days: int = 365
    # Annotation Policy
    annotation_mode: str = "human_first"  # human_first | ai_assisted | hybrid
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    updated_by: int


class AuditLog(BaseModel):
    """Operation audit log"""
    id: int
    actor_user_id: int
    actor_ip_address: str | None = None
    actor_user_agent: str | None = None
    action: str  # user_created, role_granted, policy_updated, etc
    resource_type: str  # user, organization, role_assignment, policy, etc
    resource_id: int
    organization_id: int | None = None
    changes: dict | None = None  # JSON: {before: {...}, after: {...}}
    reason: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
