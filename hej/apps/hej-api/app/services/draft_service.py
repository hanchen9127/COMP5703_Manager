"""
Draft Service
草稿功能服务层
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, UTC
from app.repositories.db_store import DBStore
from app.schemas.drafts import DraftCreate, DraftUpdate, DraftSubmit, DraftApprove
from app.services.id_service import new_id
from app.models import TaskItemStatus
from app.models.db_models import DraftDB, AnnotationDB

# Do not pull items into the review queue while dispute or finalize is in flight.
_TASK_ITEM_STATUSES_SKIP_ANNOTATED_ON_SUBMIT = frozenset(
    {
        TaskItemStatus.DISPUTED,
        TaskItemStatus.CANONICALIZED,
    }
)


class DraftService:
    """草稿服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.db_store = DBStore(db)
    
    def create_draft(
        self, 
        task_item_id: str, 
        payload: DraftCreate, 
        user_id: int | None = None
    ) -> DraftDB:
        """创建草稿"""
        draft = self.db_store.drafts.create(
            draft_id=new_id("draft"),
            task_item_id=task_item_id,
            annotation_type=payload.annotation_type,  # NEW: Include annotation type
            status="pending",
            draft_data=payload.draft_data,
            revision_notes=payload.revision_notes,  # NEW: Include revision notes if provided
            created_by=user_id,
        )
        return draft
    
    def get_draft(self, draft_id: str) -> DraftDB:
        """获取单个草稿"""
        draft = self.db_store.drafts.get(draft_id)
        
        if not draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Draft '{draft_id}' not found"
            )
        return draft
    
    def list_drafts_by_task_item(self, task_item_id: str) -> list[DraftDB]:
        """获取某个任务项的所有草稿"""
        return self.db_store.drafts.list_by_task_item(task_item_id)
    
    def update_draft(
        self, 
        draft_id: str, 
        payload: DraftUpdate
    ) -> DraftDB:
        """更新草稿"""
        draft = self.get_draft(draft_id)  # Verify exists
        
        # Can only update if status is "pending"
        if draft.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Can only update drafts in 'pending' status, current status: {draft.status}"
            )
        
        update_data = payload.model_dump(exclude_unset=True)
        draft = self.db_store.drafts.update(draft_id, **update_data)
        return draft
    
    def delete_draft(self, draft_id: str) -> bool:
        """删除草稿"""
        draft = self.get_draft(draft_id)  # Verify exists
        if draft.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Can only delete drafts in pending status. Current status: {draft.status}."
            )
        return self.db_store.drafts.delete(draft_id)
    
    def submit_draft(self, draft_id: str, payload: DraftSubmit | None = None) -> DraftDB:
        """提交草稿 - 同时创建Annotation (pending → submitted + 创建Annotation)
        
        新工作流：
        - Submit时直接创建Annotation（自动approve）
        - Draft保留为"submitted"状态便于查看历史
        - Approve endpoint不再删除Draft
        """
        draft = self.get_draft(draft_id)
        
        # Can only submit if status is "pending"
        if draft.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Can only submit drafts in 'pending' status, current status: {draft.status}"
            )
        
        # Update status to submitted and set submitted_at
        update_data = {
            "status": "submitted",
            "submitted_at": datetime.now(UTC)
        }
        
        if payload and payload.revision_notes:
            update_data["revision_notes"] = payload.revision_notes
        
        draft = self.db_store.drafts.update(draft_id, **update_data)
        
        # AUTOMATICALLY CREATE ANNOTATION when submitting (instead of waiting for separate approve)
        self._create_annotation_from_draft(draft, confirmed_by=draft.created_by)

        self._advance_task_item_to_annotated_on_submit(draft.task_item_id)

        return draft

    def _advance_task_item_to_annotated_on_submit(self, task_item_id: str) -> None:
        """Move item to ``annotated`` (UI submitted) unless status must stay put."""
        current = self.db_store.task_items.get(task_item_id)
        if current is None:
            return
        status = current.status
        if isinstance(status, str):
            try:
                status = TaskItemStatus(status)
            except ValueError:
                pass
        if status in _TASK_ITEM_STATUSES_SKIP_ANNOTATED_ON_SUBMIT:
            return
        self.db_store.task_items.update(
            task_item_id,
            status=TaskItemStatus.ANNOTATED,
        )
    
    def _create_annotation_from_draft(self, draft: DraftDB, confirmed_by: int | None = None) -> AnnotationDB:
        """从Draft创建或更新Annotation的内部方法
        
        策略：每个用户对同一项目的annotation保持唯一性
        - 如果该用户已有该item的annotation，直接更新
        - 如果没有，创建新的annotation
        """
        # Check if this user already has an annotation for this item
        existing_annotation = self.db_store.annotations.find_by_item_and_creator(
            task_item_id=draft.task_item_id,
            created_by=draft.created_by
        )
        
        if existing_annotation:
            # Update existing annotation directly
            updated = self.db_store.annotations.update(
                existing_annotation.id,
                annotation_data=draft.draft_data,
                annotation_type=draft.annotation_type,
                confidence=90,  # Mark as updated
                updated_at=datetime.now(UTC)
            )
            return updated
        
        # Create new annotation if none exists
        annotation = self.db_store.annotations.create(
            annotation_id=new_id("ann"),
            task_item_id=draft.task_item_id,
            annotation_type=draft.annotation_type,
            annotation_data=draft.draft_data,
            confidence=100,  # 100 for new annotations
            version=1,
            is_latest=True,
            created_by=draft.created_by,
            confirmed_by=confirmed_by or draft.created_by,
            confirmed_at=datetime.now(UTC)
        )
        
        return annotation
    
    def approve_draft(self, draft_id: str, payload: DraftApprove | None = None, confirmed_by: int | None = None) -> AnnotationDB:
        """批准草稿 - 仅标记状态，不删除Draft
        
        新工作流：
        - Submit时已经创建了Annotation
        - Approve只是标记Draft为"approved"状态
        - Draft保留为历史记录
        """
        draft = self.get_draft(draft_id)
        
        if draft.status != "submitted":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Can only approve drafts in submitted status. Current status: {draft.status}."
            )
        
        # Mark draft as approved (preserve history)
        self.db_store.drafts.update(draft_id, status="approved")
        
        # Return the annotation
        if draft.annotation_id:
            annotation = self.db_store.annotations.get(draft.annotation_id)
            if annotation:
                return annotation
        
        # For newly submitted drafts, find the latest annotation
        from app.models.db_models import AnnotationDB
        annotation = self.db.query(AnnotationDB).filter(
            AnnotationDB.task_item_id == draft.task_item_id,
            AnnotationDB.is_latest == True
        ).first()
        
        if not annotation:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create annotation from draft"
            )
        
        return annotation
