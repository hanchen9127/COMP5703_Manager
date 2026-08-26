"""
Organizations management routes.

Handles:
- Organization CRUD operations
- Organization policy management
- Project management within organizations (legacy endpoints)
"""

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import verify_user_org_access
from app.schemas.organizations import (
    OrganizationCreate,
    OrganizationCreateRequest,
    OrganizationCreateResponse,
    OrganizationDetailRead,
    OrganizationRead,
    OrganizationUpdateRequest,
    OrganizationUpdateResponse,
    PolicyUpdateRequest,
    PolicyUpdateResponse,
    PolicyRead,
    AdminOrganizationRead,
)
from app.schemas.projects import ProjectCreate, ProjectRead
from app.models.admin import DisputeEscalationGate
from app.services import OrganizationService, ProjectService
from app.services.admin_service import AdminService


router = APIRouter()
organization_service = OrganizationService()
project_service = ProjectService()


# ==================== Organization Management (Admin System) ====================


@router.post(
    "",
    response_model=OrganizationCreateResponse,
    status_code=201,
    summary="Create New Organization",
    description="Create a new organization. Current user becomes the organization owner and first admin.",
)
async def create_organization(
    request: OrganizationCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationCreateResponse:
    """
    Create a new organization.

    - **request.name**: Organization name
    - **request.slug**: Organization slug (URL-safe, lowercase letters, numbers, hyphens only)
    - **request.description**: Organization description (optional)
    - **current_user**: Current logged-in user, becomes the owner of the new organization

    Returns the created organization details. Errors:
    - 400: Validation failed (invalid slug format)
    - 409: Slug already in use
    """
    try:
        creator_user_id = current_user.get("user_id")
        
        result = AdminService.create_organization(
            db=db,
            name=request.name,
            slug=request.slug,
            description=request.description,
            created_by=creator_user_id,
        )
        return OrganizationCreateResponse(**result)
    except HTTPException as e:
        raise e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Organization creation failed: {str(e)}")


@router.get(
    "",
    response_model=list[AdminOrganizationRead],
    status_code=200,
    summary="Get User's Organizations",
    description="Retrieve all organizations where the current user is a member.",
)
async def list_organizations(
    limit: int = Query(100, ge=1, le=200, description="Page size"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AdminOrganizationRead]:
    """
    Get the current user's organization list.

    - **limit**: Organizations per page (default 100, max 200)
    - **offset**: Pagination offset (default 0)
    - **current_user**: Current logged-in user

    Returns all active organizations the user belongs to.
    """
    try:
        user_id = current_user.get("user_id")
        
        # Query database for user's organizations
        from app.repositories.db_store import DBStore
        store = DBStore(db)
        
        user_orgs = []
        for org_user in store.organization_users.list_all():
            # Only include active or restricted members
            if org_user.user_id == user_id and org_user.status in ["active", "restricted"]:
                org = store.organizations.get(org_user.organization_id)
                if org:
                    # Calculate member and admin counts for this organization
                    member_count = sum(1 for ou in store.organization_users.values() 
                                      if ou.organization_id == org.id and ou.status != "removed")
                    admin_count = 0
                    for role in store.role_assignments.values():
                        if role.organization_id == org.id and role.role_key == "admin" and role.revoked_at is None:
                            # Ensure this admin is an active member
                            for ou in store.organization_users.values():
                                if ou.user_id == role.user_id and ou.organization_id == org.id and ou.status != "removed":
                                    admin_count += 1
                                    break
                    
                    user_orgs.append(AdminOrganizationRead(
                        id=org.id,
                        name=org.name,
                        slug=org.slug,
                        status=org.status,
                        created_at=org.created_at,
                        member_count=member_count,
                        admin_count=admin_count,
                    ))
        
        # Apply pagination
        result = user_orgs[offset : offset + limit]
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve organization list: {str(e)}")


@router.get(
    "/{org_id}",
    response_model=OrganizationDetailRead,
    status_code=200,
    summary="Get Organization Details",
    description="Retrieve complete organization information, including member count, admin count, and policy configuration.",
)
async def get_organization(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationDetailRead:
    """
    Get specific organization details.

    - **org_id**: Organization ID
    - **current_user**: Current logged-in user (must be an organization member)

    Returns complete organization information and its policy configuration.
    Errors:
    - 404: Organization does not exist or user has no access
    """
    try:
        user_id = current_user.get("user_id")
        result = AdminService.get_organization(db, org_id, user_id)
        return OrganizationDetailRead(**result)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get organization: {str(e)}")


@router.put(
    "/{org_id}",
    response_model=OrganizationUpdateResponse,
    status_code=200,
    summary="Update Organization",
    description="Update organization name or description (admin only).",
)
async def update_organization(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    request: OrganizationUpdateRequest = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationUpdateResponse:
    """
    Update organization information.

    - **org_id**: Organization ID
    - **request.name**: New organization name (optional)
    - **request.description**: New organization description (optional)
    - **current_user**: Current logged-in user (must be an organization admin)

    Returns confirmation of the update. Only admins can update organization information.
    """
    try:
        admin_user_id = current_user.get("user_id")
        result = AdminService.update_organization(db, org_id, request.name, request.description, admin_user_id)
        return OrganizationUpdateResponse(**result)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update organization: {str(e)}")


@router.patch(
    "/{org_id}/policy",
    response_model=PolicyUpdateResponse,
    status_code=200,
    summary="Update Organization Policy",
    description="Update organization workflow policy configuration (admin only).",
)
async def update_policy(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    request: PolicyUpdateRequest = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyUpdateResponse:
    """
    Update organization policy configuration.

    - **org_id**: Organization ID
    - **request**: Policy update request (supports partial updates, only updates provided fields)
    - **current_user**: Current logged-in user (must be an organization admin)

    Returns the updated complete policy configuration. Policy fields include:
    - membership_approval_required: New members require admin approval
    - review_dual_sign_off: Review requires dual sign-off
    - review_auto_escalate_disagreement: Review disagreement auto-escalates
    - dispute_escalation_gate: Dispute escalation threshold (none/required/mandatory)
    - export_provenance_required: Export requires complete provenance tracking
    """
    try:
        admin_user_id = current_user.get("user_id")

        # Build kwargs with only provided fields
        policy_updates = {}
        if request.membership_approval_required is not None:
            policy_updates["membership_approval_required"] = request.membership_approval_required
        if request.review_dual_sign_off is not None:
            policy_updates["review_dual_sign_off"] = request.review_dual_sign_off
        if request.review_auto_escalate_disagreement is not None:
            policy_updates["review_auto_escalate_disagreement"] = request.review_auto_escalate_disagreement
        if request.dispute_escalation_threshold is not None:
            policy_updates["dispute_escalation_threshold"] = request.dispute_escalation_threshold
        if request.export_provenance_required is not None:
            policy_updates["export_provenance_required"] = request.export_provenance_required
        if request.export_retention_days is not None:
            policy_updates["export_retention_days"] = request.export_retention_days
        if request.annotation_mode is not None:
            policy_updates["annotation_mode"] = request.annotation_mode

        if request.dispute_escalation_gate is not None:
            gate = request.dispute_escalation_gate.strip().lower()
            allowed = {item.value for item in DisputeEscalationGate}
            if gate not in allowed:
                raise HTTPException(
                    status_code=400,
                    detail=f"dispute_escalation_gate must be one of: {', '.join(sorted(allowed))}",
                )
            policy_updates["dispute_escalation_gate"] = gate

        result = AdminService.update_policy(db=db, 
            org_id=org_id,
            user_id=admin_user_id,
            **policy_updates
        )
        # Build return value
        policy = result.get("policy", {})
        return PolicyUpdateResponse(
            organization_id=result.get("organization_id"),
            updated_at=result.get("updated_at"),
            policy=PolicyRead(**policy) if policy else None,
            message=result.get("message", "Policy updated")
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update policy: {str(e)}")


# ==================== Project Management (Legacy) ====================


@router.get("/{org_id}/projects", response_model=list[ProjectRead])
def list_projects(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProjectRead]:
    # Verify user has access to this organization
    verify_user_org_access(current_user, org_id)
    
    from app.services.project_service import ProjectService as DbProjectService
    service = DbProjectService(db=db)
    return service.list_projects(str(org_id))


@router.post("/{org_id}/projects", response_model=ProjectRead, status_code=201)
def create_project(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    payload: ProjectCreate = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectRead:
    """创建项目"""
    # Verify user has access to this organization
    verify_user_org_access(current_user, org_id)
    
    from app.services.project_service import ProjectService as DbProjectService
    service = DbProjectService(db=db)
    return service.create_project(str(org_id), payload)


@router.put("/{org_id}/projects/{project_id}", response_model=ProjectRead, status_code=200)
def update_project(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    project_id: str = Path(..., description="Project ID"),
    payload: ProjectCreate = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectRead:
    """更新项目"""
    # Verify user has access to this organization
    verify_user_org_access(current_user, org_id)
    
    from app.services.project_service import ProjectService as DbProjectService
    service = DbProjectService(db=db)
    
    # Verify project belongs to this organization
    project = service.get_project(project_id)
    if str(project.organization_id) != str(org_id):
        raise HTTPException(status_code=400, detail="Project does not belong to this organization")
    
    return service.update_project(
        project_id,
        name=payload.name,
        description=payload.description,
        governance_model=payload.governance_model
    )


@router.delete("/{org_id}/projects/{project_id}", status_code=204)
def delete_project(
    org_id: int = Path(..., gt=0, description="Organization ID"),
    project_id: str = Path(..., description="Project ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """删除项目"""
    # Verify user has access to this organization
    verify_user_org_access(current_user, org_id)
    
    from app.services.project_service import ProjectService as DbProjectService
    service = DbProjectService(db=db)
    
    # Verify project belongs to this organization
    project = service.get_project(project_id)
    if str(project.organization_id) != str(org_id):
        raise HTTPException(status_code=400, detail="Project does not belong to this organization")
    
    success = service.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
