"""Admin IAM service helpers for backend user and membership management."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.admin import AccountStatus, RoleKey, RoleScope
from app.models.db_models import OrganizationUserDB, RoleAssignmentDB, UserDB
from app.repositories.db_store import DBStore

ALLOWED_ADMIN_ROLES = {"admin", "task_owner", "annotator", "reviewer"}
ALLOWED_ACCOUNT_STATUSES = {"active", "suspended", "restricted"}
ACTIVE_MEMBERSHIP_STATUSES = {"active", "restricted"}


def _require_db(db: Session | None) -> Session:
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database session required",
        )
    return db


def _user_id_from_current_user(current_user: dict) -> int | None:
    user_id = current_user.get("user_id")
    if user_id is None:
        return None
    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


def _assert_org_admin(current_user: dict, organization_id: int | str) -> None:
    target_org_id = str(organization_id)
    for org_context in current_user.get("org_contexts", []):
        if str(org_context.get("organization_id")) != target_org_id:
            continue
        roles = org_context.get("roles", []) or []
        if "admin" in roles:
            return
        break
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: admin role required in target organization",
    )


def _validate_roles(roles: list[str]) -> list[str]:
    if not roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one role is required",
        )
    normalized = [str(role) for role in roles]
    invalid = [role for role in normalized if role not in ALLOWED_ADMIN_ROLES]
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role(s): {', '.join(sorted(set(invalid)))}",
        )
    return normalized


def _get_active_membership(db: Session, user_id: int, organization_id: int) -> OrganizationUserDB | None:
    memberships = (
        db.query(OrganizationUserDB)
        .filter(
            OrganizationUserDB.user_id == user_id,
            OrganizationUserDB.organization_id == organization_id,
        )
        .all()
    )
    for membership in memberships:
        if (
            membership.user_id == user_id
            and membership.organization_id == organization_id
            and membership.status in ACTIVE_MEMBERSHIP_STATUSES
        ):
            return membership
    return None


def _active_org_roles(db: Session, user_id: int, organization_id: int) -> list[RoleAssignmentDB]:
    roles = (
        db.query(RoleAssignmentDB)
        .filter(
            RoleAssignmentDB.user_id == user_id,
            RoleAssignmentDB.organization_id == organization_id,
        )
        .all()
    )
    return [
        role
        for role in roles
        if (
            role.user_id == user_id
            and role.organization_id == organization_id
            and role.project_id is None
            and role.scope == RoleScope.ORGANIZATION.value
            and role.revoked_at is None
        )
    ]


def _active_admin_user_ids(db: Session, organization_id: int) -> set[int]:
    memberships = (
        db.query(OrganizationUserDB)
        .filter(
            OrganizationUserDB.organization_id == organization_id,
        )
        .all()
    )
    active_memberships_by_user = {
        membership.user_id
        for membership in memberships
        if membership.organization_id == organization_id and membership.status in ACTIVE_MEMBERSHIP_STATUSES
    }
    admin_roles = (
        db.query(RoleAssignmentDB)
        .filter(
            RoleAssignmentDB.organization_id == organization_id,
        )
        .all()
    )
    return {
        role.user_id
        for role in admin_roles
        if (
            role.user_id in active_memberships_by_user
            and role.organization_id == organization_id
            and role.project_id is None
            and role.scope == RoleScope.ORGANIZATION.value
            and role.role_key == RoleKey.ADMIN.value
            and role.revoked_at is None
        )
    }


def _is_last_admin(db: Session, user_id: int, organization_id: int) -> bool:
    active_admins = _active_admin_user_ids(db, organization_id)
    return user_id in active_admins and len(active_admins) == 1


def _role_summary(roles: list[str]) -> list[str]:
    return sorted(set(roles))


def _membership_joined_at(membership: OrganizationUserDB):
    return membership.accepted_at or membership.invited_at or membership.created_at


def create_user_for_org(
    current_user: dict,
    *,
    email: str,
    password: str,
    name: str | None = None,
    organization_id: int,
    roles: list[str],
    db: Session | None,
):
    db = _require_db(db)
    _assert_org_admin(current_user, organization_id)
    validated_roles = _validate_roles(roles)

    store = DBStore(db)
    organization = store.organizations.get(organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization {organization_id} not found",
        )

    existing_user = store.users.get_by_email(email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email {email} already exists",
        )

    actor_user_id = _user_id_from_current_user(current_user)
    created_user = UserDB(
        id=None,
        email=email,
        password_hash=hash_password(password),
        name=name,
        account_status=AccountStatus.ACTIVE.value,
        two_factor_enabled=False,
    )
    db.add(created_user)
    db.flush()

    membership = OrganizationUserDB(
        id=None,
        user_id=created_user.id,
        organization_id=organization_id,
        status="active",
        invited_by=actor_user_id,
        accepted_at=datetime.now(UTC),
    )
    db.add(membership)

    for role in validated_roles:
        db.add(
            RoleAssignmentDB(
                id=None,
                user_id=created_user.id,
                organization_id=organization_id,
                project_id=None,
                role_key=role,
                role_name=role,
                scope=RoleScope.ORGANIZATION.value,
                granted_by=actor_user_id if actor_user_id is not None else 0,
                revoked_at=None,
            )
        )

    db.commit()
    db.refresh(created_user)
    return {
        "id": created_user.id,
        "email": created_user.email,
        "name": created_user.name,
        "account_status": created_user.account_status,
        "organization_id": organization_id,
        "roles": _role_summary(validated_roles),
    }


def set_user_account_status(
    current_user: dict,
    *,
    user_id: int,
    organization_id: int,
    account_status: str,
    db: Session | None,
):
    db = _require_db(db)
    _assert_org_admin(current_user, organization_id)

    if account_status not in ALLOWED_ACCOUNT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid account_status: {account_status}",
        )

    actor_user_id = _user_id_from_current_user(current_user)
    if actor_user_id is not None and actor_user_id == user_id and account_status in {"suspended", "restricted"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You cannot suspend or restrict your own account",
        )

    store = DBStore(db)
    user = store.users.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )

    membership = _get_active_membership(db, user_id, organization_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Active membership for user {user_id} in organization {organization_id} not found",
        )

    db_user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )
    db_user.account_status = account_status
    db_user.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(db_user)
    return store.users.get(user_id)


def set_org_member_roles(
    current_user: dict,
    *,
    user_id: int,
    organization_id: int,
    roles: list[str],
    db: Session | None,
):
    db = _require_db(db)
    _assert_org_admin(current_user, organization_id)
    validated_roles = _validate_roles(roles)

    store = DBStore(db)
    user = store.users.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )

    membership = _get_active_membership(db, user_id, organization_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Active membership for user {user_id} in organization {organization_id} not found",
        )

    current_roles = _active_org_roles(db, user_id, organization_id)
    current_role_keys = {role.role_key for role in current_roles}
    actor_user_id = _user_id_from_current_user(current_user)

    if RoleKey.ADMIN.value in current_role_keys and RoleKey.ADMIN.value not in validated_roles and _is_last_admin(db, user_id, organization_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot remove the last active admin from the organization",
        )

    now = datetime.now(UTC)
    for role in current_roles:
        role.revoked_at = now
        role.revoked_by = actor_user_id
        role.change_reason = "roles_replaced"
        role.updated_at = now
    db.flush()

    created_roles = []
    for role in validated_roles:
        db_role = RoleAssignmentDB(
            id=None,
            user_id=user_id,
            organization_id=organization_id,
            project_id=None,
            role_key=role,
            role_name=role,
            scope=RoleScope.ORGANIZATION.value,
            granted_by=actor_user_id if actor_user_id is not None else 0,
            revoked_at=None,
        )
        db.add(db_role)
        created_roles.append(role)

    db.commit()
    return {
        "user_id": user_id,
        "organization_id": organization_id,
        "roles": _role_summary(created_roles),
    }


def remove_org_member(
    current_user: dict,
    *,
    user_id: int,
    organization_id: int,
    db: Session | None,
):
    db = _require_db(db)
    _assert_org_admin(current_user, organization_id)

    store = DBStore(db)
    user = store.users.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )

    membership = _get_active_membership(db, user_id, organization_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Active membership for user {user_id} in organization {organization_id} not found",
        )

    if _is_last_admin(db, user_id, organization_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot remove the last active admin from the organization",
        )

    now = datetime.now(UTC)
    db_membership = membership
    db_membership.status = "removed"
    db_membership.removed_at = now
    db_membership.removed_by = _user_id_from_current_user(current_user)
    db_membership.updated_at = now

    active_roles = _active_org_roles(db, user_id, organization_id)
    for role in active_roles:
        role.revoked_at = now
        role.revoked_by = _user_id_from_current_user(current_user)
        role.change_reason = "member_removed"
        role.updated_at = now

    db.commit()
    db.refresh(db_membership)
    return {
        "id": db_membership.id,
        "user_id": db_membership.user_id,
        "organization_id": db_membership.organization_id,
        "status": db_membership.status,
        "removed_at": db_membership.removed_at,
        "removed_by": db_membership.removed_by,
    }


def list_org_members_for_admin(
    current_user: dict,
    organization_id: int,
    db: Session,
    include_removed: bool = False,
) -> list[dict]:
    db = _require_db(db)
    _assert_org_admin(current_user, organization_id)

    memberships = (
        db.query(OrganizationUserDB)
        .filter(
            OrganizationUserDB.organization_id == organization_id,
        )
        .all()
    )
    if not include_removed:
        memberships = [membership for membership in memberships if membership.status in ACTIVE_MEMBERSHIP_STATUSES]

    user_ids = [membership.user_id for membership in memberships if membership.organization_id == organization_id]
    users = (
        db.query(UserDB)
        .filter(UserDB.id.in_(user_ids))
        .all()
        if user_ids
        else []
    )
    users_by_id = {user.id: user for user in users}

    roles = (
        db.query(RoleAssignmentDB)
        .filter(
            RoleAssignmentDB.organization_id == organization_id,
        )
        .all()
    )
    roles_by_user: dict[int, list[str]] = {}
    for role in roles:
        if (
            role.organization_id == organization_id
            and role.project_id is None
            and role.scope == RoleScope.ORGANIZATION.value
            and role.revoked_at is None
        ):
            roles_by_user.setdefault(role.user_id, []).append(role.role_key)

    member_reads = []
    for membership in memberships:
        user = users_by_id.get(membership.user_id)
        if not user:
            continue
        member_reads.append(
            {
                "user_id": user.id,
                "email": user.email,
                "name": user.name,
                "account_status": user.account_status,
                "organization_id": organization_id,
                "membership_status": membership.status,
                "roles": sorted(set(roles_by_user.get(user.id, []))),
                "joined_at": _membership_joined_at(membership),
                "removed_at": membership.removed_at,
            }
        )
    return member_reads
