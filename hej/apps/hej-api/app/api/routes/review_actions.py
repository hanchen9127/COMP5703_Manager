"""Task-item review actions, adjustment read, escalation routing, and finalized listing."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import verify_user_is_active, verify_user_task_access
from app.core.security import get_current_user
from app.models import TaskItemStatus
from app.models.db_models import (
    AnnotationDB,
    ReviewDB,
    TaskItemDB,
    TaskItemEscalationDB,
)
from app.schemas.review_actions import (
    EscalationDecisionRequest,
    EscalationDecisionResponse,
    EscalationListItem,
    EscalationListResponse,
    EscalationRouteRequest,
    EscalationRouteResponse,
    FinalizedItemsResponse,
    FinalizedTaskItemRead,
    TaskItemAdjustmentRead,
    TaskItemReviewActionRequest,
    TaskItemReviewActionResponse,
)
from app.services import TaskService
from app.services.task_history_recorder import TaskHistoryRecorder
from app.services.task_item_status_resolution import ensure_expert_send_back_status
from app.services.review_policy_enforcement import (
    assert_can_add_approval,
    assert_escalation_allowed,
    dual_signoff_accept_outcome_after_review,
    resolve_for_task,
)


router = APIRouter()


def _record_task_history(
    db: Session,
    *,
    task,
    operator_id: int,
    operation: str,
    summary: str,
    description: str | None = None,
    resource_type: str = "task_item",
    resource_id: str,
    new_values: dict[str, Any] | None = None,
) -> None:
    TaskHistoryRecorder.record(
        db,
        operation=operation,
        task_id=task.id,
        project_id=task.project_id,
        operator_id=operator_id,
        summary=summary,
        description=description,
        resource_type=resource_type,
        resource_id=resource_id,
        new_values=new_values,
    )


def _map_action_to_review_status(action: str) -> str:
    if action == "accept":
        return "approved"
    if action == "reject":
        return "rejected"
    if action in {"adjust", "revise"}:
        return "needs_revision"
    if action == "escalate":
        return "needs_revision"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported action '{action}'",
    )


def _map_action_to_next_ui_status(action: str) -> str:
    if action == "accept":
        return "approved"
    if action == "reject":
        return "rejected"
    if action in {"adjust", "revise"}:
        return "returned"
    if action == "escalate":
        return "disputed"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported action '{action}'",
    )


def _map_action_to_task_item_status(action: str) -> str:
    """Persist coarse backend status on ``TaskItemDB`` for list/read paths."""
    if action == "accept":
        return "canonicalized"
    if action == "reject":
        return "rejected"
    if action in {"adjust", "revise"}:
        return "returned"
    if action == "escalate":
        return "disputed"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported action '{action}'",
    )


def _map_escalation_decision_to_task_item_status(decision: str) -> str:
    """Persist task item status after dispute desk closes an open escalation."""
    if decision == "finalize":
        return "canonicalized"
    if decision == "send_back":
        return "expert_send_back"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported escalation decision '{decision}'",
    )


def _latest_annotation(db: Session, task_item_id: str) -> AnnotationDB | None:
    return (
        db.query(AnnotationDB)
        .filter(
            AnnotationDB.task_item_id == task_item_id,
            AnnotationDB.is_latest.is_(True),
        )
        .order_by(AnnotationDB.version.desc())
        .first()
    )


def _latest_review(db: Session, task_item_id: str) -> ReviewDB | None:
    return (
        db.query(ReviewDB)
        .filter(ReviewDB.task_item_id == task_item_id)
        .order_by(ReviewDB.created_at.desc())
        .first()
    )


def _open_escalation(
    db: Session, task_id: str, task_item_id: str
) -> TaskItemEscalationDB | None:
    return (
        db.query(TaskItemEscalationDB)
        .filter(
            TaskItemEscalationDB.task_id == task_id,
            TaskItemEscalationDB.task_item_id == task_item_id,
            TaskItemEscalationDB.status == "open",
        )
        .order_by(TaskItemEscalationDB.routed_at.desc())
        .first()
    )


def _load_task_item(
    db: Session, task_id: str, task_item_id: str
) -> TaskItemDB:
    item = db.query(TaskItemDB).filter(TaskItemDB.id == task_item_id).first()
    if not item or item.task_id != task_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task item not found for this task",
        )
    return item


def _as_preview_dict(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    return {"value": value}


@router.post(
    "/{task_id}/task-items/{task_item_id}/review-actions",
    response_model=TaskItemReviewActionResponse,
)
def submit_task_item_review_action(
    task_id: str,
    task_item_id: str,
    payload: TaskItemReviewActionRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskItemReviewActionResponse:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)

    item = _load_task_item(db, task_id, task_item_id)
    annotation = _latest_annotation(db, task_item_id)
    if not annotation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No annotation to review yet; submit a draft first",
        )

    action = payload.action
    resolved = resolve_for_task(db, task)
    if action == "escalate":
        assert_escalation_allowed(resolved)

    review_status = _map_action_to_review_status(action)
    next_ui = _map_action_to_next_ui_status(action)
    next_item_status = _map_action_to_task_item_status(action)
    approvals_received = 0
    approvals_required = resolved.review_required_approvals
    review_mode = resolved.review_mode

    if action == "accept" and resolved.review_dual_sign_off:
        reviewer_id = int(current_user["user_id"])
        assert_can_add_approval(db, annotation.id, reviewer_id)

    notes_parts: list[str] = []
    if payload.comment:
        notes_parts.append(payload.comment.strip())
    if action == "escalate":
        notes_parts.insert(0, "[escalation]")
    if payload.final_payload:
        notes_parts.append(f"final_payload={payload.final_payload.strip()[:500]}")
    if payload.final_verdict:
        notes_parts.append(f"final_verdict={payload.final_verdict.strip()[:500]}")
    review_notes = "\n".join(notes_parts) if notes_parts else None

    reviewer_id = current_user["user_id"]
    review_id = str(uuid.uuid4())
    review = ReviewDB(
        id=review_id,
        annotation_id=annotation.id,
        task_item_id=task_item_id,
        reviewed_by=reviewer_id,
        review_status=review_status,
        review_score=None,
        review_notes=review_notes,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    db.add(review)
    db.flush()

    if action == "accept" and resolved.review_dual_sign_off:
        next_ui, next_item_status, approvals_received, approvals_required = (
            dual_signoff_accept_outcome_after_review(
                db=db,
                annotation_id=annotation.id,
                resolved=resolved,
            )
        )

    item.status = next_item_status
    item.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(review)

    if action == "accept" and not resolved.review_dual_sign_off:
        approvals_received = 1
        approvals_required = 1

    _record_task_history(
        db,
        task=task,
        operator_id=int(current_user["user_id"]),
        operation="review_action",
        summary=f"Review {action} on item {task_item_id}",
        description=f"review_status={review.review_status}; next_item_status={next_item_status}",
        resource_id=task_item_id,
        new_values={"action": action, "next_item_status": next_item_status},
    )

    return TaskItemReviewActionResponse(
        review_id=review.id,
        review_status=review.review_status,
        next_ui_status=next_ui,
        review_mode=review_mode,
        approvals_received=approvals_received,
        approvals_required=approvals_required,
    )


@router.get(
    "/{task_id}/task-items/{task_item_id}/adjustment",
    response_model=TaskItemAdjustmentRead,
)
def get_task_item_adjustment(
    task_id: str,
    task_item_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskItemAdjustmentRead:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)

    item = _load_task_item(db, task_id, task_item_id)
    annotation = _latest_annotation(db, task_item_id)
    review = _latest_review(db, task_item_id)
    esc = _open_escalation(db, task_id, task_item_id)

    last_payload: dict[str, Any] | None = None
    if annotation and annotation.annotation_data is not None:
        last_payload = _as_preview_dict(annotation.annotation_data)

    routed_at = esc.routed_at if esc else None
    routed_by = str(esc.routed_by) if esc else None

    return TaskItemAdjustmentRead(
        task_id=task_id,
        task_item_id=task_item_id,
        base_status=item.status,
        payload_preview=_as_preview_dict(item.payload_preview),
        last_submitted_payload=last_payload,
        reviewer_note=review.review_notes if review else None,
        routed_by=routed_by,
        routed_at=routed_at,
    )


@router.post(
    "/{task_id}/task-items/{task_item_id}/escalations/route",
    response_model=EscalationRouteResponse,
)
def route_escalation(
    task_id: str,
    task_item_id: str,
    payload: EscalationRouteRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EscalationRouteResponse:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)
    assert_escalation_allowed(resolve_for_task(db, task))

    item = _load_task_item(db, task_id, task_item_id)
    now = datetime.now(UTC)
    if item.status != "disputed":
        item.status = "disputed"
        item.updated_at = now

    if _open_escalation(db, task_id, task_item_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An open escalation already exists for this task item; decide or resolve it first",
        )

    esc_id = str(uuid.uuid4())
    row = TaskItemEscalationDB(
        id=esc_id,
        task_id=task_id,
        task_item_id=task_item_id,
        target=payload.target,
        assignee_ref=payload.assignee_ref,
        note=payload.note,
        routed_by=current_user["user_id"],
        routed_at=now,
        status="open",
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    _record_task_history(
        db,
        task=task,
        operator_id=int(current_user["user_id"]),
        operation="escalation_routed",
        summary=f"Escalation routed to {payload.target}",
        description=payload.note,
        resource_id=task_item_id,
        new_values={"target": payload.target, "escalation_id": esc_id},
    )

    return EscalationRouteResponse(
        task_item_id=task_item_id,
        target=payload.target,
        assignee_ref=payload.assignee_ref,
        routed_at=row.routed_at,
        next_status="disputed",
    )


@router.post(
    "/{task_id}/task-items/{task_item_id}/escalations/decision",
    response_model=EscalationDecisionResponse,
)
def decide_escalation(
    task_id: str,
    task_item_id: str,
    payload: EscalationDecisionRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EscalationDecisionResponse:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)

    item = _load_task_item(db, task_id, task_item_id)
    esc = _open_escalation(db, task_id, task_item_id)
    if not esc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No open escalation for this task item",
        )

    now = datetime.now(UTC)
    preview = _as_preview_dict(item.payload_preview)
    if payload.payload_preview is not None:
        preview = {**preview, **payload.payload_preview}

    next_status = _map_escalation_decision_to_task_item_status(payload.decision)
    if payload.decision == "send_back":
        item.status = TaskItemStatus.EXPERT_SEND_BACK
    else:
        item.status = next_status
    item.updated_at = now
    esc.status = "resolved"
    esc.decision = payload.decision
    esc.decision_note = payload.note
    esc.decided_by = current_user["user_id"]
    esc.decided_at = now
    esc.payload_preview_snap = preview
    esc.updated_at = now

    db.commit()
    db.refresh(item)

    if payload.decision == "send_back":
        ensure_expert_send_back_status(db, task_id, task_item_id)

    _record_task_history(
        db,
        task=task,
        operator_id=int(current_user["user_id"]),
        operation="escalation_decided",
        summary=f"Escalation decision: {payload.decision}",
        description=payload.note,
        resource_id=task_item_id,
        new_values={"decision": payload.decision, "next_status": next_status},
    )

    return EscalationDecisionResponse(
        next_status=next_status,
        payload_preview=preview,
    )


@router.get(
    "/{task_id}/escalations",
    response_model=EscalationListResponse,
)
def list_escalations(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EscalationListResponse:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)

    rows = (
        db.query(TaskItemEscalationDB)
        .filter(
            TaskItemEscalationDB.task_id == task_id,
            TaskItemEscalationDB.status == "open",
        )
        .order_by(TaskItemEscalationDB.routed_at.desc())
        .all()
    )
    item_ids = [r.task_item_id for r in rows]
    external_ref_by_id: dict[str, str] = {}
    if item_ids:
        task_items = db.query(TaskItemDB).filter(TaskItemDB.id.in_(item_ids)).all()
        external_ref_by_id = {
            row.id: row.external_item_ref
            for row in task_items
            if row.external_item_ref and str(row.external_item_ref).strip()
        }
    items = [
        EscalationListItem(
            task_item_id=r.task_item_id,
            external_item_ref=external_ref_by_id.get(r.task_item_id),
            status=r.status,
            target=r.target,  # type: ignore[arg-type]
            assignee_ref=r.assignee_ref,
            routed_at=r.routed_at,
            note=r.note,
        )
        for r in rows
    ]
    return EscalationListResponse(task_id=task_id, items=items)


@router.get(
    "/{task_id}/finalized-items",
    response_model=FinalizedItemsResponse,
)
def list_finalized_items(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FinalizedItemsResponse:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)

    rows = (
        db.query(TaskItemDB)
        .filter(
            TaskItemDB.task_id == task_id,
            TaskItemDB.status == "canonicalized",
        )
        .order_by(TaskItemDB.updated_at.desc())
        .all()
    )
    items = [
        FinalizedTaskItemRead(
            id=r.id,
            task_id=r.task_id,
            external_item_ref=(
                str(r.external_item_ref).strip()
                if r.external_item_ref and str(r.external_item_ref).strip()
                else None
            ),
            status=r.status,
            finalized_at=r.updated_at,
        )
        for r in rows
    ]
    return FinalizedItemsResponse(task_id=task_id, items=items)


@router.get(
    "/{task_id}/finalized-items/{task_item_id}",
    response_model=FinalizedTaskItemRead,
)
def get_finalized_item(
    task_id: str,
    task_item_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FinalizedTaskItemRead:
    verify_user_is_active(current_user)
    service = TaskService(db=db)
    task = service.get_task(task_id)
    verify_user_task_access(current_user, task, db)

    item = _load_task_item(db, task_id, task_item_id)
    if item.status != "canonicalized":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task item is not finalized (canonicalized)",
        )
    return FinalizedTaskItemRead(
        id=item.id,
        task_id=item.task_id,
        external_item_ref=(
            str(item.external_item_ref).strip()
            if item.external_item_ref and str(item.external_item_ref).strip()
            else None
        ),
        status=item.status,
        finalized_at=item.updated_at,
    )
