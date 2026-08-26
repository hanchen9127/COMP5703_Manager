"""
Draft API routes
草稿相关API端点 (新工作流：Draft 是中间状态，通过 submit + approve 转换为 Annotation)
"""

from fastapi import APIRouter, Depends, Path, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import verify_user_is_active
from app.core.resource_scope import (
    verify_user_draft_access,
    verify_user_task_item_access,
)
from app.schemas.drafts import (
    DraftCreate,
    DraftRead,
    DraftUpdate,
    DraftSubmit,
    DraftApprove,
    DraftListResponse,
    DraftToAnnotationResponse,
)
from app.models.db_models import TaskItemDB
from app.services.draft_service import DraftService
from app.services import TaskService
from app.services.task_history_recorder import TaskHistoryRecorder


router = APIRouter()


@router.post(
    "/task-items/{task_item_id}/drafts",
    response_model=DraftRead,
    status_code=201,
)
def create_draft(
    task_item_id: str = Path(..., description="Task Item ID"),
    payload: DraftCreate = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DraftRead:
    """
    Create draft for a task item
    
    新工作流：
    - 初次创建标注时创建 Draft (status: pending)
    - 修改标注时也创建新的 Draft (可选指定 annotation_id 表示基于某个版本修改)
    """
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_task_item_access(current_user, task_item_id, db)
    
    # Create draft
    service = DraftService(db=db)
    draft = service.create_draft(
        task_item_id=task_item_id,
        payload=payload,
        user_id=current_user.get("user_id")
    )
    
    return DraftRead(
        id=draft.id,
        task_item_id=draft.task_item_id,
        annotation_id=getattr(draft, 'annotation_id', None),
        status=draft.status,
        annotation_type=draft.annotation_type,
        draft_data=draft.draft_data,
        revision_notes=getattr(draft, 'revision_notes', None),
        created_by=draft.created_by,
        created_at=draft.created_at,
        submitted_at=getattr(draft, 'submitted_at', None),
        updated_at=draft.updated_at,
    )


@router.get(
    "/task-items/{task_item_id}/drafts",
    response_model=DraftListResponse,
)
def list_drafts(
    task_item_id: str = Path(..., description="Task Item ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DraftListResponse:
    """List drafts for a task item (pending and submitted)"""
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_task_item_access(current_user, task_item_id, db)
    
    # Get drafts
    service = DraftService(db=db)
    drafts = service.list_drafts_by_task_item(task_item_id)
    
    draft_reads = [
        DraftRead(
            id=d.id,
            task_item_id=d.task_item_id,
            annotation_id=getattr(d, 'annotation_id', None),
            status=d.status,
            annotation_type=d.annotation_type,
            draft_data=d.draft_data,
            revision_notes=getattr(d, 'revision_notes', None),
            created_by=d.created_by,
            created_at=d.created_at,
            submitted_at=getattr(d, 'submitted_at', None),
            updated_at=d.updated_at,
        )
        for d in drafts
    ]
    
    return DraftListResponse(
        task_item_id=task_item_id,
        drafts=draft_reads,
        total_count=len(drafts),
    )


@router.get(
    "/drafts/{draft_id}",
    response_model=DraftRead,
)
def get_draft(
    draft_id: str = Path(..., description="Draft ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DraftRead:
    """Get a single draft"""
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_draft_access(current_user, draft_id, db)
    
    # Get draft
    service = DraftService(db=db)
    draft = service.get_draft(draft_id)
    
    return DraftRead(
        id=draft.id,
        task_item_id=draft.task_item_id,
        annotation_id=getattr(draft, 'annotation_id', None),
        status=draft.status,
        annotation_type=getattr(draft, 'annotation_type', ''),
        draft_data=draft.draft_data,
        revision_notes=getattr(draft, 'revision_notes', None),
        created_by=draft.created_by,
        created_at=draft.created_at,
        submitted_at=getattr(draft, 'submitted_at', None),
        updated_at=draft.updated_at,
    )


@router.patch(
    "/drafts/{draft_id}",
    response_model=DraftRead,
)
def update_draft(
    draft_id: str = Path(..., description="Draft ID"),
    payload: DraftUpdate = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DraftRead:
    """Update draft"""
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_draft_access(current_user, draft_id, db)
    
    # Update draft
    service = DraftService(db=db)
    draft = service.update_draft(draft_id, payload)
    
    return DraftRead(
        id=draft.id,
        task_item_id=draft.task_item_id,
        annotation_id=getattr(draft, 'annotation_id', None),
        status=draft.status,
        annotation_type=draft.annotation_type,
        draft_data=draft.draft_data,
        revision_notes=getattr(draft, 'revision_notes', None),
        created_by=draft.created_by,
        created_at=draft.created_at,
        submitted_at=getattr(draft, 'submitted_at', None),
        updated_at=draft.updated_at,
    )


@router.delete(
    "/drafts/{draft_id}",
    status_code=204,
)
def delete_draft(
    draft_id: str = Path(..., description="Draft ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete draft (only when status is 'pending')"""
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_draft_access(current_user, draft_id, db)
    
    # Delete draft
    service = DraftService(db=db)
    service.delete_draft(draft_id)


@router.post(
    "/drafts/{draft_id}/submit",
    response_model=dict,
    status_code=200,
)
def submit_draft(
    draft_id: str = Path(..., description="Draft ID"),
    payload: DraftSubmit = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Submit draft for review
    
    新工作流：
    - Draft 从 pending → submitted
    - 等待审核员批准
    - 批准后自动转换为 Annotation
    """
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_draft_access(current_user, draft_id, db)
    
    # Submit draft
    service = DraftService(db=db)
    draft = service.submit_draft(draft_id, payload)

    task_item = db.query(TaskItemDB).filter(TaskItemDB.id == draft.task_item_id).first()
    if task_item:
        task_service = TaskService(db=db)
        task = task_service.get_task(task_item.task_id)
        operator_id = current_user.get("user_id")
        if operator_id is not None:
            TaskHistoryRecorder.record(
                db,
                operation="draft_submitted",
                task_id=task.id,
                project_id=task.project_id,
                operator_id=int(operator_id),
                summary="Draft submitted for review",
                description="First-pass work submitted for review",
                resource_type="task_item",
                resource_id=draft.task_item_id,
            )

    return {
        "id": draft.id,
        "status": draft.status,
        "submitted_at": draft.submitted_at,
        "message": "Draft submitted for review"
    }


@router.post(
    "/drafts/{draft_id}/approve",
    response_model=DraftToAnnotationResponse,
    status_code=201,
)
def approve_draft(
    draft_id: str = Path(..., description="Draft ID"),
    payload: DraftApprove = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DraftToAnnotationResponse:
    """
    Approve draft and convert to Annotation
    
    新工作流：
    1. Draft 必须是 submitted 状态
    2. 批准后创建 Annotation (新版本)
    3. 自动删除 Draft (临时状态清理)
    4. 如果是修改，自动更新旧版本的 is_latest=false
    
    返回：
    - annotation_id: 新创建的 Annotation ID
    - version: 版本号 (初次为 1，修改后递增)
    - status: "confirmed"
    - message: 成功消息
    """
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_draft_access(current_user, draft_id, db)
    
    # Approve and convert to annotation
    service = DraftService(db=db)
    annotation = service.approve_draft(
        draft_id=draft_id,
        payload=payload,
        confirmed_by=current_user.get("user_id")
    )
    
    return DraftToAnnotationResponse(
        annotation_id=annotation.id,
        version=annotation.version,
        status="confirmed",
        message=f"Draft approved and converted to Annotation v{annotation.version}"
    )
