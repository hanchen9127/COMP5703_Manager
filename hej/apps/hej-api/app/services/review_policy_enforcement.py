"""Review and dispute policy checks used by review action routes."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Task
from app.models.admin import OrganizationPolicy
from app.models.db_models import ProjectDB, ReviewDB, TaskItemDB
from app.repositories.db_store import DBStore
from app.services.policy_resolver import PolicyResolver, ResolvedPolicy
from fastapi import HTTPException, status


def organization_policy_for_task(db: Session, task: Task) -> OrganizationPolicy | None:
    project = db.query(ProjectDB).filter(ProjectDB.id == task.project_id).first()
    if not project:
        return None
    return DBStore(db).organization_policies.get_by_organization_id(
        int(project.organization_id)
    )


def resolve_for_task(db: Session, task: Task) -> ResolvedPolicy:
    org_policy = organization_policy_for_task(db, task)
    return PolicyResolver.resolve_task_policy(task, org_policy)


def distinct_approved_reviewers(db: Session, annotation_id: str) -> set[int]:
    rows = (
        db.query(ReviewDB)
        .filter(
            ReviewDB.annotation_id == annotation_id,
            ReviewDB.review_status == "approved",
        )
        .all()
    )
    return {int(row.reviewed_by) for row in rows if row.reviewed_by is not None}


def assert_escalation_allowed(resolved: ResolvedPolicy) -> None:
    gate = resolved.dispute_escalation_gate
    if gate == "none":
        return
    if gate in {"required", "mandatory"}:
        return
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported dispute escalation gate '{gate}'",
    )


def assert_can_add_approval(db: Session, annotation_id: str, reviewer_id: int) -> None:
    if reviewer_id in distinct_approved_reviewers(db, annotation_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already approved this annotation. Another reviewer is required by this task's review policy.",
        )


def dual_signoff_accept_outcome_after_review(
    *,
    db: Session,
    annotation_id: str,
    resolved: ResolvedPolicy,
) -> tuple[str, str, int, int]:
    """Return (next_ui_status, next_item_status, approvals_received, approvals_required)."""
    approvals_received = len(distinct_approved_reviewers(db, annotation_id))
    required = resolved.review_required_approvals
    if approvals_received < required:
        return "pending_second_review", "annotated", approvals_received, required
    return "approved", "canonicalized", approvals_received, required
