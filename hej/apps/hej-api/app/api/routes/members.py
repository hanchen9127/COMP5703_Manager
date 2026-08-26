"""
Members and role management routes for organizations.

Handles:
- Member invitations and acceptance
- Role assignment and revocation
- Member listing with role aggregation
"""

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.database import get_db
from app.schemas.members import (
    InvitationAcceptResponse,
    MemberInviteRequest,
    MemberInviteResponse,
    MemberListResponse,
    MemberRead,
    PendingInvitationListResponse,
    RoleAssignRequest,
    RoleAssignResponse,
    RoleRevokeResponse,
)
from app.services.admin_service import AdminService

router = APIRouter()


@router.get(
    "",
    response_model=PendingInvitationListResponse,
    status_code=200,
    summary="Get Pending Invitations",
    description="Get all pending organization invitations for current user.",
)
async def list_pending_invitations(
    limit: int = Query(100, ge=1, le=200, description="Page size"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PendingInvitationListResponse:
    """
    Get pending invitations for current user.

    - **limit**: Invitations per page (default 100, max 200)
    - **offset**: Pagination offset (default 0)
    - **current_user**: Current logged-in user

    Returns list of organizations that have invited this user (but not yet accepted).
    """
    try:
        user_email = current_user.get("email")
        user_id = current_user.get("user_id")
        
        # Query for pending invitations where this user was invited
        from app.models import Membership, Organization
        pending_invitations = db.query(Membership, Organization).filter(
            Membership.user_id == user_id,
            Membership.status == "invited"
        ).join(Organization, Membership.organization_id == Organization.id).all()
        
        invitations_list = []
        for membership, org in pending_invitations:
            invitations_list.append({
                "id": membership.id,
                "organization_id": org.id,
                "organization_name": org.name,
                "organization_slug": org.slug,
                "invited_email": user_email,
                "invited_at": membership.invited_at,
                "expires_at": getattr(membership, "expires_at", None),
                "status": membership.status,
            })
        
        # Apply pagination
        paginated_invitations = invitations_list[offset : offset + limit]
        
        return PendingInvitationListResponse(
            total_count=len(invitations_list),
            invitations=paginated_invitations
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve invitations: {str(e)}")


@router.post(
    "/{org_id}/members/invite",
    response_model=MemberInviteResponse,
    status_code=201,
    summary="Invite Member to Organization",
    description="Organization admin invites new members to join organization (invited users must be registered).",
)
async def invite_member(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    request: MemberInviteRequest = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MemberInviteResponse:
    """
    Invite member to organization.

    - **org_id**: Organization ID
    - **request.email**: Email of user to invite (user must be registered)
    - **current_user**: Current logged-in user (must be organization admin)

    Returns invitation details including invitation token (sent via email).
    """
    try:
        inviter_user_id = current_user.get("user_id")

        result = AdminService.invite_member(
            db=db, org_id=org_id, email=request.email, user_id=inviter_user_id
        )
        return MemberInviteResponse(**result)
    except HTTPException as e:
        # Re-raise HTTPException from service layer with original status code
        raise e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        # Log unexpected errors but still return validation error if needed
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")


@router.get(
    "/{org_id}/members",
    response_model=MemberListResponse,
    status_code=200,
    summary="Get Organization Members",
    description="Get all active organization members and their roles.",
)
async def list_members(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    limit: int = Query(100, ge=1, le=200, description="Page size"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MemberListResponse:
    """
    Get organization members list.

    - **org_id**: Organization ID
    - **limit**: Members per page (default 100, max 200)
    - **offset**: Pagination offset (default 0)
    - **current_user**: Current logged-in user (must be organization member)

    Returns member list and their assigned roles.
    """
    try:
        user_id = current_user.get("user_id")
        result = AdminService.list_members(db=db, org_id=org_id, user_id=user_id)
        
        # Apply pagination
        members = result.get("members", [])
        paginated_members = members[offset : offset + limit]
        
        return MemberListResponse(
            organization_id=org_id,
            total_count=len(members),
            members=[MemberRead(**m) for m in paginated_members]
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to retrieve member list")


@router.post(
    "/invitations/{token}/accept",
    response_model=InvitationAcceptResponse,
    status_code=200,
    summary="Accept Organization Invitation",
    description="User accepts invitation and joins organization.",
)
async def accept_invitation(
    token: str = Path(..., description="Invitation token (from email link)"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InvitationAcceptResponse:
    """
    Accept organization invitation.

    - **token**: Invitation token (JWT format, contains user ID and organization ID)
    - **current_user**: Current logged-in user (must match user ID in token)

    Returns invitation acceptance confirmation and member details.
    """
    try:
        user_id = current_user.get("user_id")

        # Extract org_id from token (need to decode JWT)
        from app.core.security import decode_token
        token_data = decode_token(token)
        org_id = token_data.get("org_id")
        token_user_id = token_data.get("sub")
        
        # Verify user in token matches current user
        if token_user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="User in invitation token does not match current user"
            )

        result = AdminService.accept_invitation(db=db, user_id=user_id, org_id=org_id)
        return InvitationAcceptResponse(**result)
    except HTTPException as e:
        raise e
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to accept invitation")


@router.post(
    "/{org_id}/members/{user_id}/roles",
    response_model=RoleAssignResponse,
    status_code=201,
    summary="Assign Role to Member",
    description="Organization admin assigns new role to member (same user can have multiple roles).",
)
async def assign_role(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    user_id: int = Path(..., gt=0, description="Target member ID"),
    request: RoleAssignRequest = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RoleAssignResponse:
    """
    Assign role to member.

    - **org_id**: Organization ID
    - **user_id**: Target member user ID
    - **request.role_key**: Role key (admin/task_owner/annotator/reviewer/arbitrator/dispute_participant)
    - **current_user**: Current logged-in user (must be organization admin)

    Returns details of newly assigned role.
    """
    try:
        admin_user_id = current_user.get("user_id")

        result = AdminService.assign_role(
            db=db,
            org_id=org_id,
            user_id=user_id,
            role_key=request.role_key,
            admin_id=admin_user_id,
        )
        return RoleAssignResponse(**result)
    except HTTPException as e:
        raise e
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to assign role")


@router.delete(
    "/{org_id}/members/{user_id}/roles/{role_id}",
    response_model=RoleRevokeResponse,
    status_code=200,
    summary="Revoke Member Role",
    description="Organization admin revokes member role (can optionally specify revocation reason).",
)
async def revoke_role(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    user_id: int = Path(..., gt=0, description="Target member ID"),
    role_id: int = Path(..., gt=0, description="Role assignment ID"),
    reason: str = Query(None, description="Revocation reason (for audit log)"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RoleRevokeResponse:
    """
    Revoke member role.

    - **org_id**: Organization ID
    - **user_id**: Target member user ID
    - **role_id**: Role assignment ID to revoke
    - **reason**: Revocation reason (optional, for audit log)
    - **current_user**: Current logged-in user (must be organization admin)

    Returns revocation confirmation. Security checks:
    - Returns 403 error if revoking last admin
    - Admin cannot revoke their own last admin role
    """
    try:
        admin_user_id = current_user.get("user_id")

        result = AdminService.revoke_role(
            db=db,
            org_id=org_id,
            admin_user_id=admin_user_id,
            role_assignment_id=role_id,
            reason=reason,
        )
        return RoleRevokeResponse(**result)
    except HTTPException as e:
        raise e
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to revoke role")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to revoke role")
