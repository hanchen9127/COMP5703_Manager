"""Permission verification helpers."""

from fastapi import HTTPException, status
from sqlalchemy import exists
from sqlalchemy.orm import Session

from app.models.db_models import OrganizationUserDB
from app.repositories.db_store import DBStore

LIVE_ORG_MEMBERSHIP_STATUSES = {"active", "restricted"}


def verify_user_is_active(current_user: dict) -> int:
    """
    Verify the user is active and return the user_id.

    Args:
        current_user: User dict parsed from the JWT token.

    Returns:
        User ID (int).

    Raises:
        HTTPException: If the user is not active.
    """
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: no user_id"
        )
    return user_id


def get_user_org_ids(current_user: dict) -> list[int]:
    """
    Extract the organization IDs the user can access from the token.

    Args:
        current_user: User dict parsed from the JWT token.

    Returns:
        List of organization IDs the user can access.
    """
    org_contexts = current_user.get("org_contexts", [])
    org_ids = []
    
    for org_context in org_contexts:
        org_id = org_context.get("organization_id")
        if org_id:
            org_ids.append(org_id)
    
    return org_ids


def verify_user_org_access(
    current_user: dict,
    org_id: int | str,
    db: Session | None = None,
) -> bool:
    """
    Verify the user can access the specified organization.

    Args:
        current_user: User dict parsed from the JWT token.
        org_id: Organization ID to access.

    Returns:
        True if the user has access.

    Raises:
        HTTPException: If the user cannot access the organization.
    """
    org_ids = get_user_org_ids(current_user)
    user_id = current_user.get("user_id")

    # Normalize all IDs to strings for comparison.
    org_id_str = str(org_id)
    org_ids_str = [str(oid) for oid in org_ids]

    if org_id_str not in org_ids_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: You do not have permission to access organization {org_id}"
        )

    if db is not None:
        try:
            org_id_int = int(org_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Invalid organization {org_id}"
            )

        membership_exists = db.query(
            exists().where(
                OrganizationUserDB.user_id == user_id,
                OrganizationUserDB.organization_id == org_id_int,
                OrganizationUserDB.removed_at.is_(None),
                OrganizationUserDB.status.in_(LIVE_ORG_MEMBERSHIP_STATUSES),
            )
        ).scalar()
        if not membership_exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You do not have permission to access organization {org_id}"
            )

    return True


def verify_user_project_access(
    current_user: dict,
    project,
    db: Session = None,
) -> bool:
    """
    Verify the user can access the specified project.

    This works by checking the organization the project belongs to.

    Args:
        current_user: User dict parsed from the JWT token.
        project: Project object or ID.
        db: Optional database session.

    Returns:
        True if the user has access.

    Raises:
        HTTPException: If the user cannot access the project.
    """
    # Get the project's organization ID.
    if hasattr(project, "organization_id"):
        org_id = project.organization_id
    else:
        # If project is an ID string, load it from the database.
        if db:
            db_store = DBStore(db)
            project_obj = db_store.projects.get(project)
            if not project_obj:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Project {project} not found"
                )
            org_id = project_obj.organization_id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot verify project access: missing project object or db"
            )
    
    # Verify the user has access to this organization.
    verify_user_org_access(current_user, org_id, db)
    return True


def verify_user_task_access(
    current_user: dict,
    task,
    db: Session = None,
) -> bool:
    """
    Verify the user can access the specified task.

    This works by checking the organization of the project the task belongs to.

    Args:
        current_user: User dict parsed from the JWT token.
        task: Task object or ID.
        db: Database session.

    Returns:
        True if the user has access.

    Raises:
        HTTPException: If the user cannot access the task.
    """
    if not db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database session required for task access verification"
        )
    
    db_store = DBStore(db)
    
    # Get the task object.
    if hasattr(task, "id"):
        task_id = task.id
        project_id = task.project_id
    else:
        task_id = task
        task_obj = db_store.tasks.get(task_id)
        if not task_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )
        project_id = task_obj.project_id
    
    # Get the project.
    project = db_store.projects.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Verify user has access to the project's organization.
    verify_user_project_access(current_user, project, db)
    return True


def verify_user_has_role(
    current_user: dict,
    org_id: int | str,
    required_roles: list[str],
) -> bool:
    """
    Verify the user has the required role(s) in the specified organization.

    Args:
        current_user: User dict parsed from the JWT token.
        org_id: Organization ID.
        required_roles: Required roles list, e.g. ["admin", "reviewer"].

    Returns:
        True if the user has one of the required roles.

    Raises:
        HTTPException: If the user does not have the required role(s).
    """
    # Normalize string and integer IDs.
    try:
        org_id_int = int(org_id)
    except (ValueError, TypeError):
        org_id_int = org_id
    
    org_contexts = current_user.get("org_contexts", [])
    
    for org_context in org_contexts:
        if org_context.get("organization_id") == org_id_int:
            user_roles = org_context.get("roles", [])
            
            # Check whether the user has any required role.
            if any(role in user_roles for role in required_roles):
                return True
            
            # The user is in the organization but does not have the required role.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You do not have required role(s) {required_roles} in organization {org_id}"
            )
    
    # The user is not in the organization.
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Access denied: You do not have permission in organization {org_id}"
    )
