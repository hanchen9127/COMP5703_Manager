from fastapi import APIRouter, Depends, Path, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import (
    verify_user_is_active,
    verify_user_project_access,
)
from app.schemas.disputes import DisputeCaseRead
from app.schemas.exports import ExportPackageRead
from app.schemas.policies import ProjectPoliciesRead
from app.schemas.projects import ProjectRead, ProjectCreate
from app.schemas.tasks import TaskCreate
from app.schemas.tasks import TaskRead
from app.services import ProjectService
from app.services import TaskService
from app.services.project_disputes_service import ProjectDisputesService
from app.services.project_exports_service import ProjectExportsService
from app.services.project_policies_service import ProjectPoliciesService
from app.models import TaskStatus


router = APIRouter()



@router.get("", response_model=list[ProjectRead])
def list_projects(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProjectRead]:
    """List all projects accessible to current user"""
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get all projects where user has access (through organization membership)
    service = ProjectService(db=db)
    return service.list_projects_for_user(current_user)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectRead:
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get project
    service = ProjectService(db=db)
    project = service.get_project(project_id)
    
    # Verify user has access to this project's organization
    verify_user_project_access(current_user, project, db)
    
    return project


@router.put("/{project_id}", response_model=ProjectRead, status_code=200)
def update_project(
    project_id: str = Path(..., description="Project ID"),
    payload: ProjectCreate = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectRead:
    """Update project with permission checks"""
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get project to verify access
    service = ProjectService(db=db)
    project = service.get_project(project_id)
    
    # Verify user has access to this project's organization
    verify_user_project_access(current_user, project, db)
    
    # Update project
    return service.update_project(
        project_id,
        name=payload.name,
        description=payload.description,
        governance_model=payload.governance_model
    )


@router.get("/{project_id}/policies", response_model=ProjectPoliciesRead)
def get_project_policies(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectPoliciesRead:
    verify_user_is_active(current_user)
    project_service = ProjectService(db=db)
    project = project_service.get_project(project_id)
    verify_user_project_access(current_user, project, db)
    return ProjectPoliciesService(db=db).get_project_policies(project_id)


@router.get("/{project_id}/disputes", response_model=list[DisputeCaseRead])
def list_project_disputes(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DisputeCaseRead]:
    """List dispute cases (escalations) for all tasks in a project."""
    verify_user_is_active(current_user)
    project_service = ProjectService(db=db)
    project = project_service.get_project(project_id)
    verify_user_project_access(current_user, project, db)
    return ProjectDisputesService(db=db).list_project_disputes(project_id)


@router.get("/{project_id}/exports", response_model=list[ExportPackageRead])
def list_project_exports(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ExportPackageRead]:
    """List current project export packages."""
    verify_user_is_active(current_user)
    project_service = ProjectService(db=db)
    project = project_service.get_project(project_id)
    verify_user_project_access(current_user, project, db)
    return ProjectExportsService(db=db).list_project_exports(project_id)


@router.get("/{project_id}/tasks", response_model=list[TaskRead])
def list_tasks(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TaskRead]:
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get project to verify access
    project_service = ProjectService(db=db)
    project = project_service.get_project(project_id)
    
    # Verify user has access to this project's organization
    verify_user_project_access(current_user, project, db)
    
    # List tasks in the project
    task_service = TaskService(db=db)
    return task_service.list_tasks(project_id)


@router.post("/{project_id}/tasks", response_model=TaskRead, status_code=201)
def create_task(
    project_id: str,
    payload: TaskCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskRead:
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get project to verify access
    project_service = ProjectService(db=db)
    project = project_service.get_project(project_id)
    
    # Verify user has access to this project's organization
    verify_user_project_access(current_user, project, db)
    
    # Create task
    task_service = TaskService(db=db)
    return task_service.create_task(
        project_id,
        payload,
        operator_id=current_user.get("user_id"),
    )


@router.put("/{project_id}/tasks/{task_id}", response_model=TaskRead, status_code=200)
def update_task(
    project_id: str = Path(..., description="Project ID"),
    task_id: str = Path(..., description="Task ID"),
    payload: TaskCreate = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskRead:
    """Update task with permission checks"""
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get project to verify access
    project_service = ProjectService(db=db)
    project = project_service.get_project(project_id)
    
    # Verify user has access to this project's organization
    verify_user_project_access(current_user, project, db)
    
    # Update task
    task_service = TaskService(db=db)
    return task_service.update_task(
        task_id,
        operator_id=current_user.get("user_id"),
        title=payload.title,
        description=payload.description,
        judgment_question=payload.judgment_question,
        task_type=payload.task_type,
        annotation_mode=payload.annotation_mode,
        label_schema_ref=payload.label_schema_ref,
        text_span_label_options=payload.text_span_label_options,
        review_policy_ref=payload.review_policy_ref,
        dispute_policy_ref=payload.dispute_policy_ref,
        export_policy_ref=payload.export_policy_ref,
    )


@router.delete("/{project_id}/tasks/{task_id}", status_code=204)
def delete_task(
    project_id: str = Path(..., description="Project ID"),
    task_id: str = Path(..., description="Task ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete task with permission checks"""
    # Verify user is active
    verify_user_is_active(current_user)
    
    # Get project to verify access
    project_service = ProjectService(db=db)
    project = project_service.get_project(project_id)
    
    # Verify user has access to this project's organization
    verify_user_project_access(current_user, project, db)
    
    # Delete task
    task_service = TaskService(db=db)
    success = task_service.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
