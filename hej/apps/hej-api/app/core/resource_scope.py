"""Resource scope helpers for task-adjacent resources.

These helpers enforce that a caller can only operate on resources that belong
to a task/project the caller already has access to.
"""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import verify_user_project_access
from app.models.db_models import AnnotationDB, DraftDB, ProjectDB, ReviewDB, TaskDB, TaskItemDB


def verify_user_task_item_access(
    current_user: dict,
    task_item_id: str,
    db: Session,
) -> TaskItemDB:
    """Load a task item and verify task/project scope."""
    task_item = db.query(TaskItemDB).filter(TaskItemDB.id == task_item_id).first()
    if not task_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task item {task_item_id} not found",
        )

    task = db.query(TaskDB).filter(TaskDB.id == task_item.task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_item.task_id} not found",
        )

    project = db.query(ProjectDB).filter(ProjectDB.id == task.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {task.project_id} not found",
        )

    # Validate scope directly from DB rows to avoid domain-model conversion
    # failures on partially-migrated dev data.
    verify_user_project_access(current_user, project, db)
    return task_item


def verify_user_draft_access(
    current_user: dict,
    draft_id: str,
    db: Session,
) -> DraftDB:
    """Load a draft and verify access through its owning task item."""
    draft = db.query(DraftDB).filter(DraftDB.id == draft_id).first()
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Draft {draft_id} not found",
        )

    verify_user_task_item_access(current_user, draft.task_item_id, db)
    return draft


def verify_user_annotation_access(
    current_user: dict,
    annotation_id: str,
    db: Session,
) -> AnnotationDB:
    """Load an annotation and verify access through its owning task item."""
    annotation = db.query(AnnotationDB).filter(AnnotationDB.id == annotation_id).first()
    if not annotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annotation not found",
        )

    verify_user_task_item_access(current_user, annotation.task_item_id, db)
    return annotation


def verify_user_review_access(
    current_user: dict,
    review_id: str,
    db: Session,
) -> ReviewDB:
    """Load a review and verify access through its owning task item."""
    review = db.query(ReviewDB).filter(ReviewDB.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    verify_user_task_item_access(current_user, review.task_item_id, db)
    return review
