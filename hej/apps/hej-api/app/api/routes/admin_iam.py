"""Admin IAM routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.admin_iam import (
    AdminMemberRemoveResponse,
    AdminMemberRolesResponse,
    AdminMemberRolesUpdateRequest,
    AdminOrgMemberRead,
    AdminUserCreateRequest,
    AdminUserCreateResponse,
    AdminUserStatusResponse,
    AdminUserStatusUpdateRequest,
)
from app.services.admin_iam_service import (
    create_user_for_org,
    list_org_members_for_admin,
    remove_org_member,
    set_org_member_roles,
    set_user_account_status,
)


router = APIRouter()


@router.post("/users", response_model=AdminUserCreateResponse, status_code=201)
def create_user(
    request: AdminUserCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AdminUserCreateResponse:
    result = create_user_for_org(
        current_user,
        email=request.email,
        password=request.password,
        name=request.name,
        organization_id=request.organization_id,
        roles=request.roles,
        db=db,
    )
    return AdminUserCreateResponse(**result)


@router.patch("/users/{user_id}/status", response_model=AdminUserStatusResponse)
def update_user_status(
    user_id: int,
    request: AdminUserStatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AdminUserStatusResponse:
    result = set_user_account_status(
        current_user,
        user_id=user_id,
        organization_id=request.organization_id,
        account_status=request.account_status,
        db=db,
    )
    return AdminUserStatusResponse(
        id=result.id,
        email=result.email,
        name=result.name,
        account_status=getattr(result.account_status, "value", result.account_status),
    )


@router.patch(
    "/organizations/{organization_id}/members/{user_id}/roles",
    response_model=AdminMemberRolesResponse,
)
def update_member_roles(
    organization_id: int,
    user_id: int,
    request: AdminMemberRolesUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AdminMemberRolesResponse:
    result = set_org_member_roles(
        current_user,
        user_id=user_id,
        organization_id=organization_id,
        roles=request.roles,
        db=db,
    )
    return AdminMemberRolesResponse(**result)


@router.delete(
    "/organizations/{organization_id}/members/{user_id}",
    response_model=AdminMemberRemoveResponse,
)
def remove_member(
    organization_id: int,
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AdminMemberRemoveResponse:
    result = remove_org_member(
        current_user,
        user_id=user_id,
        organization_id=organization_id,
        db=db,
    )
    return AdminMemberRemoveResponse(**result)


@router.get(
    "/organizations/{organization_id}/members",
    response_model=list[AdminOrgMemberRead],
)
def list_members(
    organization_id: int,
    include_removed: bool = False,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AdminOrgMemberRead]:
    result = list_org_members_for_admin(
        current_user,
        organization_id=organization_id,
        db=db,
        include_removed=include_removed,
    )
    return [AdminOrgMemberRead(**member) for member in result]
