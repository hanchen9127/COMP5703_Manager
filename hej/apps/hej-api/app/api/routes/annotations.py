"""
Annotation API routes
标注相关API端点 (新工作流：Annotation 仅通过 Draft 批准创建，为只读)
"""

from fastapi import APIRouter, Depends, Path, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, UTC
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import verify_user_is_active
from app.core.resource_scope import (
    verify_user_annotation_access,
    verify_user_review_access,
    verify_user_task_item_access,
)
from app.schemas.annotations import (
    AnnotationRead,
    AnnotationListResponse,
    AnnotationDetailRead,
    ReviewRead,
    ReviewCreate,
    ReviewUpdate,
)
from app.services.annotation_service import AnnotationService
from app.models.db_models import AnnotationDB, ReviewDB, DraftDB


router = APIRouter()



# Note: Annotations are now created through the Draft workflow
# POST /api/drafts/{draft_id}/approve → converts Draft to Annotation
# See routes/drafts.py for the complete Draft → Annotation workflow


@router.get(
    "/task-items/{task_item_id}/annotations",
    response_model=AnnotationListResponse,
)
def list_annotations(
    task_item_id: str = Path(..., description="Task Item ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnnotationListResponse:
    """
    List annotations for a task item (only latest versions)
    
    新工作流：
    - 仅返回最新版本 (is_latest=true)
    - Annotation 通过 Draft 批准工作流创建
    - 权限：用户 token 有效即可（project 层已做权限隔离）
    """
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_task_item_access(current_user, task_item_id, db)
    
    # Get latest annotations
    service = AnnotationService(db=db)
    annotations = service.list_annotations_by_task_item(task_item_id)
    
    annotation_reads = [
        AnnotationRead(
            id=a.id,
            task_item_id=a.task_item_id,
            annotation_type=a.annotation_type,
            annotation_data=a.annotation_data,
            confidence=a.confidence,
            version=a.version,
            is_latest=a.is_latest,
            created_by=a.created_by,
            confirmed_by=a.confirmed_by,
            created_at=a.created_at,
            confirmed_at=a.confirmed_at,
            updated_at=a.updated_at,
        )
        for a in annotations
    ]
    
    return AnnotationListResponse(
        task_item_id=task_item_id,
        annotations=annotation_reads,
        total_count=len(annotations),
    )



@router.get(
    "/annotations/{annotation_id}",
    response_model=AnnotationRead,
)
def get_annotation(
    annotation_id: str = Path(..., description="Annotation ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnnotationRead:
    """
    Get a single annotation (read-only)
    
    新工作流：
    - Annotation 是最终确认版本
    - 由 Draft 批准工作流创建
    - 权限：用户 token 有效即可（project 层已做权限隔离）
    """
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_annotation_access(current_user, annotation_id, db)
    
    # Keep service lookup for existing business logic / error behavior
    service = AnnotationService(db=db)
    annotation = service.get_annotation(annotation_id)
    
    return AnnotationRead(
        id=annotation.id,
        task_item_id=annotation.task_item_id,
        annotation_type=annotation.annotation_type,
        annotation_data=annotation.annotation_data,
        confidence=annotation.confidence,
        version=annotation.version,
        is_latest=annotation.is_latest,
        created_by=annotation.created_by,
        confirmed_by=annotation.confirmed_by,
        created_at=annotation.created_at,
        confirmed_at=annotation.confirmed_at,
        updated_at=annotation.updated_at,
    )


@router.get(
    "/annotations/{annotation_id}/history",
    response_model=dict,
)
def get_annotation_history(
    annotation_id: str = Path(..., description="Annotation ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Get complete version history for an annotation
    
    返回所有版本（包括旧版本）：
    {
        "annotation_id": "ann_001",
        "task_item_id": "item_001",
        "versions": [
            {"version": 1, "is_latest": false, "annotation_data": {...}, "confidence": 90, "confirmed_at": "..."},
            {"version": 2, "is_latest": true, "annotation_data": {...}, "confidence": 95, "confirmed_at": "..."}
        ]
    }
    
    权限：用户 token 有效即可（project 层已做权限隔离）
    """
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_annotation_access(current_user, annotation_id, db)
    
    # Get all versions
    service = AnnotationService(db=db)
    versions = service.get_annotation_history(annotation_id)
    
    if not versions:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    # Get basic info from any version
    first_version = versions[0]
    
    version_reads = [
        {
            "version": v.version,
            "is_latest": v.is_latest,
            "annotation_type": v.annotation_type,
            "annotation_data": v.annotation_data,
            "confidence": v.confidence,
            "created_by": v.created_by,
            "confirmed_by": v.confirmed_by,
            "created_at": v.created_at,
            "confirmed_at": v.confirmed_at,
        }
        for v in versions
    ]
    
    return {
        "annotation_id": annotation_id,
        "task_item_id": first_version.task_item_id,
        "versions": version_reads,
        "total_versions": len(versions),
    }


# ==================== Review API Routes ====================


@router.post(
    "/annotations/{annotation_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    annotation_id: str = Path(..., description="Annotation ID"),
    payload: ReviewCreate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewRead:
    """
    Create a review for an annotation
    
    标注审核流程：
    - 审核人提交审核意见
    - review_status: approved (通过), rejected (拒绝), needs_revision (需要修改)
    - review_score: 可选审核评分 (0-100)
    - review_notes: 审核意见
    """
    # Verify user is active
    verify_user_is_active(current_user)
    annotation = verify_user_annotation_access(current_user, annotation_id, db)
    
    # Create review record
    review_id = str(uuid.uuid4())
    review = ReviewDB(
        id=review_id,
        annotation_id=annotation_id,
        task_item_id=annotation.task_item_id,
        reviewed_by=current_user.get("user_id"),
        review_status=payload.review_status,
        review_score=payload.review_score,
        review_notes=payload.review_notes,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    return ReviewRead(
        id=review.id,
        annotation_id=review.annotation_id,
        task_item_id=review.task_item_id,
        reviewed_by=review.reviewed_by,
        review_status=review.review_status,
        review_score=review.review_score,
        review_notes=review.review_notes,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.get(
    "/annotations/{annotation_id}/reviews",
    response_model=list[ReviewRead],
)
def list_annotation_reviews(
    annotation_id: str = Path(..., description="Annotation ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ReviewRead]:
    """
    Get all reviews for an annotation
    
    返回该标注的所有审核记录
    """
    # Verify user is active
    verify_user_is_active(current_user)
    verify_user_annotation_access(current_user, annotation_id, db)
    
    # Get all reviews
    reviews = db.query(ReviewDB).filter(ReviewDB.annotation_id == annotation_id).all()
    
    return [
        ReviewRead(
            id=r.id,
            annotation_id=r.annotation_id,
            task_item_id=r.task_item_id,
            reviewed_by=r.reviewed_by,
            review_status=r.review_status,
            review_score=r.review_score,
            review_notes=r.review_notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in reviews
    ]


@router.get(
    "/reviews/{review_id}",
    response_model=ReviewRead,
)
def get_review(
    review_id: str = Path(..., description="Review ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewRead:
    """
    Get a single review record
    
    返回审核记录详情
    """
    # Verify user is active
    verify_user_is_active(current_user)
    review = verify_user_review_access(current_user, review_id, db)
    
    return ReviewRead(
        id=review.id,
        annotation_id=review.annotation_id,
        task_item_id=review.task_item_id,
        reviewed_by=review.reviewed_by,
        review_status=review.review_status,
        review_score=review.review_score,
        review_notes=review.review_notes,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.patch(
    "/reviews/{review_id}",
    response_model=ReviewRead,
)
def update_review(
    review_id: str = Path(..., description="Review ID"),
    payload: ReviewUpdate = ...,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewRead:
    """
    Update a review record
    
    更新审核状态、评分或意见
    """
    # Verify user is active
    verify_user_is_active(current_user)
    review = verify_user_review_access(current_user, review_id, db)
    
    # Update fields
    if payload.review_status is not None:
        review.review_status = payload.review_status
    if payload.review_score is not None:
        review.review_score = payload.review_score
    if payload.review_notes is not None:
        review.review_notes = payload.review_notes
    
    review.updated_at = datetime.now(UTC)
    
    db.commit()
    db.refresh(review)
    
    return ReviewRead(
        id=review.id,
        annotation_id=review.annotation_id,
        task_item_id=review.task_item_id,
        reviewed_by=review.reviewed_by,
        review_status=review.review_status,
        review_score=review.review_score,
        review_notes=review.review_notes,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.post(
    "/reviews/{review_id}/submit",
    response_model=ReviewRead,
)
def submit_review(
    review_id: str = Path(..., description="Review ID"),
    payload: dict = ...,  # {review_status, review_score?, review_notes?, draft_id?}
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewRead:
    """
    Submit a review for an annotation
    
    审核人提交审核意见：
    1. 更新 review 状态和评分
    2. 如果指定了 draft_id，更新 draft 状态
    
    Request payload:
    {
        "review_status": "approved|rejected|needs_revision",
        "review_score": 0-100 (optional),
        "review_notes": "..." (optional),
        "draft_id": "..." (optional)
    }
    
    注意：这里只是提交审核意见，不会自动生成新 Annotation
    """
    # Verify user is active
    verify_user_is_active(current_user)
    review = verify_user_review_access(current_user, review_id, db)
    
    # Update review
    review.review_status = payload.get("review_status", review.review_status)
    if "review_score" in payload and payload["review_score"] is not None:
        review.review_score = payload["review_score"]
    if "review_notes" in payload and payload["review_notes"] is not None:
        review.review_notes = payload["review_notes"]
    review.updated_at = datetime.now(UTC)
    
    # Update draft status if draft_id provided
    if "draft_id" in payload and payload["draft_id"]:
        draft = db.query(DraftDB).filter(DraftDB.id == payload["draft_id"]).first()
        if draft:
            draft.status = "reviewed"  # Mark draft as reviewed
            draft.updated_at = datetime.now(UTC)
    
    db.commit()
    db.refresh(review)
    
    return ReviewRead(
        id=review.id,
        annotation_id=review.annotation_id,
        task_item_id=review.task_item_id,
        reviewed_by=review.reviewed_by,
        review_status=review.review_status,
        review_score=review.review_score,
        review_notes=review.review_notes,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.delete(
    "/reviews/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_review(
    review_id: str = Path(..., description="Review ID"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """
    Delete a review record
    
    删除审核记录
    """
    # Verify user is active
    verify_user_is_active(current_user)
    review = verify_user_review_access(current_user, review_id, db)
    
    # Delete review
    db.delete(review)
    db.commit()
