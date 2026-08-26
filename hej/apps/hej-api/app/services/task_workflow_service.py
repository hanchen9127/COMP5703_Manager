"""Derive workflow lineage from task posture and item aggregates."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models import Task
from app.models.db_models import TaskItemDB, TaskItemEscalationDB
from app.schemas.task_history import (
    HistoryCategory,
    TaskItemCountsRead,
    TaskWorkflowLineageResponse,
    WorkflowStepRead,
)

STEP_ORDER = (
    "task_setup",
    "data_source",
    "first_pass_work",
    "review_dispute",
    "finalized",
)

STEP_FILTER_CATEGORIES: dict[str, list[HistoryCategory]] = {
    "task_setup": ["setup", "policy"],
    "data_source": ["data"],
    "first_pass_work": ["annotation"],
    "review_dispute": ["review", "dispute"],
    "finalized": ["review", "dispute", "system"],
}

STEP_WORKSPACE_TAB: dict[str, str] = {
    "task_setup": "setup",
    "data_source": "items",
    "first_pass_work": "annotate",
    "review_dispute": "review",
    "finalized": "finalized",
}


def _count_items(db: Session, task_id: str) -> TaskItemCountsRead:
    rows = db.query(TaskItemDB.status).filter(TaskItemDB.task_id == task_id).all()
    counts = TaskItemCountsRead(total=len(rows))
    for (status,) in rows:
        key = status or "pending"
        if key == "pending":
            counts.pending += 1
        elif key == "annotated":
            counts.annotated += 1
        elif key == "reviewed":
            counts.reviewed += 1
        elif key == "disputed":
            counts.disputed += 1
        elif key == "canonicalized":
            counts.canonicalized += 1
    return counts


def _open_escalations(db: Session, task_id: str) -> int:
    return (
        db.query(TaskItemEscalationDB)
        .filter(
            TaskItemEscalationDB.task_id == task_id,
            TaskItemEscalationDB.status == "open",
        )
        .count()
    )


def _resolve_current_step_key(
    *,
    is_draft: bool,
    has_items: bool,
    counts: TaskItemCountsRead,
    open_esc: int,
    all_canonical: bool,
) -> str | None:
    if all_canonical and has_items:
        return None

    if is_draft:
        return "task_setup"
    if not has_items:
        return "data_source"
    if counts.pending > 0:
        return "first_pass_work"
    if open_esc > 0 or counts.disputed > 0:
        return "review_dispute"
    if counts.canonicalized < counts.total:
        return "review_dispute"
    # Items exist, nothing pending — governance / finalize in flight
    return "review_dispute"


def _headline_and_next_action(
    current_key: str | None,
    *,
    open_esc: int,
    counts: TaskItemCountsRead,
    annotation_mode: str,
) -> tuple[str, str]:
    if current_key is None:
        return (
            "Task complete",
            "All items are canonicalized. Review export readiness on the Finalized tab.",
        )

    if current_key == "task_setup":
        return (
            "Finish task setup",
            "Complete definition, policy refs, and activate the task on Setup.",
        )
    if current_key == "data_source":
        return (
            "Register task data",
            "Add external pointers as task items on Items or via dataset registration.",
        )
    if current_key == "first_pass_work":
        label = "AI annotation" if annotation_mode == "ai_assisted" else "Human annotation"
        return (
            f"{label} in progress",
            f"{counts.pending} item(s) still need first-pass work — open Annotate.",
        )
    if current_key == "review_dispute":
        if open_esc > 0:
            return (
                "Dispute resolution required",
                f"{open_esc} open escalation(s) — resolve on Review or Dispute.",
            )
        if counts.disputed > 0:
            return (
                "Disputed items need resolution",
                "Clear disputed items before finalizing canonical judgments.",
            )
        return (
            "Review and finalize judgments",
            "Confirm or escalate remaining items on Review, then move to Finalized.",
        )

    return (
        "Finalize canonical outputs",
        f"{counts.canonicalized}/{counts.total} canonicalized — complete remaining on Finalized.",
    )


class TaskWorkflowService:
    @staticmethod
    def build_lineage(db: Session, task: Task) -> TaskWorkflowLineageResponse:
        task_id = task.id
        status = str(task.status.value) if hasattr(task.status, "value") else str(task.status)
        annotation_mode = (
            str(task.annotation_mode.value)
            if hasattr(task.annotation_mode, "value")
            else str(task.annotation_mode)
        )
        counts = _count_items(db, task_id)
        open_esc = _open_escalations(db, task_id)

        is_draft = status == "draft"
        has_items = counts.total > 0
        all_canonical = has_items and counts.canonicalized == counts.total

        current_key = _resolve_current_step_key(
            is_draft=is_draft,
            has_items=has_items,
            counts=counts,
            open_esc=open_esc,
            all_canonical=all_canonical,
        )

        current_index = (
            len(STEP_ORDER) if current_key is None else STEP_ORDER.index(current_key)
        )

        first_pass_title = (
            "AI annotation"
            if annotation_mode == "ai_assisted"
            else "Human annotation"
        )
        first_pass_description = (
            "Candidate outputs are generated and attached to queued items."
            if annotation_mode == "ai_assisted"
            else "Operators produce first-pass work on task items."
        )

        step_templates: list[tuple[str, str, str, str | None]] = [
            (
                "task_setup",
                "Task setup",
                "Task definition, policy refs, and launch posture.",
                f"status={status}",
            ),
            (
                "data_source",
                "Data source ready",
                "External pointers registered as task items without owning raw data.",
                f"{counts.total} items registered" if has_items else "No items yet",
            ),
            (
                "first_pass_work",
                first_pass_title,
                first_pass_description,
                (
                    f"{counts.pending} pending · {counts.annotated} annotated"
                    if has_items
                    else "Waiting for data"
                ),
            ),
            (
                "review_dispute",
                "Review and dispute",
                "Governance after first-pass work: review, escalation, and dispute resolution.",
                (
                    f"{counts.reviewed} reviewed · {counts.disputed} disputed · "
                    f"{open_esc} open escalation(s)"
                ),
            ),
            (
                "finalized",
                "Finalized",
                "Canonical judgments ready for export and delivery.",
                (
                    f"{counts.canonicalized}/{counts.total} canonicalized"
                    if has_items
                    else "No items"
                ),
            ),
        ]

        steps: list[WorkflowStepRead] = []
        for index, (key, title, description, evidence) in enumerate(step_templates):
            if index < current_index:
                step_state = "complete"
                tone = "default"
            elif index > current_index:
                step_state = "later"
                tone = "default"
            elif key == "review_dispute" and open_esc > 0:
                step_state = "blocked"
                tone = "dark"
            else:
                step_state = "in_progress"
                tone = "accent" if key in {"task_setup", "first_pass_work"} else "default"

            steps.append(
                WorkflowStepRead(
                    key=key,
                    title=title,
                    description=description,
                    state=step_state,  # type: ignore[arg-type]
                    tone=tone,  # type: ignore[arg-type]
                    evidence=evidence,
                    filter_categories=STEP_FILTER_CATEGORIES[key],
                    workspace_tab=STEP_WORKSPACE_TAB[key],
                )
            )

        headline, next_action = _headline_and_next_action(
            current_key,
            open_esc=open_esc,
            counts=counts,
            annotation_mode=annotation_mode,
        )

        return TaskWorkflowLineageResponse(
            task_id=task_id,
            task_status=status,
            annotation_mode=annotation_mode,
            generated_at=datetime.now(UTC),
            item_counts=counts,
            open_escalations=open_esc,
            steps=steps,
            current_step_key=current_key,
            headline=headline,
            next_action=next_action,
        )
