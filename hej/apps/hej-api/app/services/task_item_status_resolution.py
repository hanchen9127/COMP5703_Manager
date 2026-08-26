"""Resolve and repair task-item statuses for dispute send-back paths."""

from __future__ import annotations

import json
from datetime import UTC, datetime

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models import TaskItem, TaskItemStatus
from app.models.db_models import AuditLogDB, DraftDB, TaskItemDB, TaskItemEscalationDB

EXPERT_SEND_BACK_STATUS = "expert_send_back"
CANONICALIZED_STATUS = "canonicalized"
RESOLVED_ESCALATION = "resolved"
SEND_BACK_DECISION = "send_back"
LEGACY_ADJUST_DECISION = "adjust"
LEGACY_MISFILED_ANNOTATED = "annotated"


def _resolved_send_back_decision_filter():
    """Match send_back and legacy adjust rows that were stored as annotated."""
    return or_(
        TaskItemEscalationDB.decision == SEND_BACK_DECISION,
        and_(
            TaskItemEscalationDB.decision == LEGACY_ADJUST_DECISION,
            TaskItemDB.status == LEGACY_MISFILED_ANNOTATED,
        ),
    )


def _latest_resolved_escalations(db: Session, task_id: str) -> dict[str, TaskItemEscalationDB]:
    """Most recent resolved escalation per task item (by decided_at)."""
    rows = (
        db.query(TaskItemEscalationDB)
        .filter(
            TaskItemEscalationDB.task_id == task_id,
            TaskItemEscalationDB.status == RESOLVED_ESCALATION,
            TaskItemEscalationDB.decided_at.isnot(None),
        )
        .order_by(TaskItemEscalationDB.decided_at.desc())
        .all()
    )
    latest: dict[str, TaskItemEscalationDB] = {}
    for row in rows:
        if row.task_item_id not in latest:
            latest[row.task_item_id] = row
    return latest


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _audit_send_back_timestamps(db: Session, task_id: str) -> dict[str, datetime]:
    """Fallback when escalation row exists but item status was never upgraded."""
    timestamps: dict[str, datetime] = {}
    logs = (
        db.query(AuditLogDB)
        .filter(
            AuditLogDB.task_id == task_id,
            AuditLogDB.operation == "escalation_decided",
            AuditLogDB.resource_type == "task_item",
        )
        .order_by(AuditLogDB.created_at.desc())
        .all()
    )
    for log in logs:
        item_id = (log.resource_id or "").strip()
        if not item_id or item_id in timestamps:
            continue
        payload = _parse_audit_json(log.new_values)
        if payload.get("decision") == SEND_BACK_DECISION and log.created_at is not None:
            timestamps[item_id] = log.created_at
    return timestamps


def _audit_send_back_item_ids(db: Session, task_id: str) -> set[str]:
    return set(_audit_send_back_timestamps(db, task_id).keys())


def _latest_send_back_at(
    db: Session,
    task_id: str,
    task_item_id: str,
) -> datetime | None:
    """Most recent send-back decision timestamp for one task item."""
    latest: datetime | None = None
    escalation = (
        db.query(TaskItemEscalationDB)
        .filter(
            TaskItemEscalationDB.task_id == task_id,
            TaskItemEscalationDB.task_item_id == task_item_id,
            TaskItemEscalationDB.status == RESOLVED_ESCALATION,
            TaskItemEscalationDB.decision == SEND_BACK_DECISION,
            TaskItemEscalationDB.decided_at.isnot(None),
        )
        .order_by(TaskItemEscalationDB.decided_at.desc())
        .first()
    )
    if escalation and escalation.decided_at is not None:
        latest = escalation.decided_at

    audit_at = _audit_send_back_timestamps(db, task_id).get(task_item_id)
    if audit_at is not None and (latest is None or _normalize_datetime(audit_at) > _normalize_datetime(latest)):
        latest = audit_at
    return latest


def _has_resubmitted_draft_after(
    db: Session,
    task_item_id: str,
    send_back_at: datetime | None,
) -> bool:
    """True when a submitted draft exists after the latest send-back decision."""
    if send_back_at is None:
        return False

    cutoff = _normalize_datetime(send_back_at)
    drafts = (
        db.query(DraftDB)
        .filter(
            DraftDB.task_item_id == task_item_id,
            DraftDB.status == "submitted",
            DraftDB.submitted_at.isnot(None),
        )
        .all()
    )
    return any(
        draft.submitted_at is not None
        and _normalize_datetime(draft.submitted_at) > cutoff
        for draft in drafts
    )


def _parse_audit_json(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


def collect_expert_send_back_item_ids(db: Session, task_id: str) -> set[str]:
    """Task items that belong in the Annotate expert send-back queue."""
    ids: set[str] = set()
    latest = _latest_resolved_escalations(db, task_id)

    for item_id, esc in latest.items():
        if esc.decision == SEND_BACK_DECISION:
            if not _has_resubmitted_draft_after(db, item_id, esc.decided_at):
                ids.add(item_id)
            continue
        if esc.decision == LEGACY_ADJUST_DECISION:
            item = (
                db.query(TaskItemDB)
                .filter(TaskItemDB.id == item_id, TaskItemDB.task_id == task_id)
                .first()
            )
            if item and item.status == LEGACY_MISFILED_ANNOTATED:
                if not _has_resubmitted_draft_after(db, item_id, esc.decided_at):
                    ids.add(item_id)

    # Audit is authoritative when DB row status or escalation metadata lagged.
    for item_id, sent_back_at in _audit_send_back_timestamps(db, task_id).items():
        if not _has_resubmitted_draft_after(db, item_id, sent_back_at):
            ids.add(item_id)

    finalized = {
        row[0]
        for row in db.query(TaskItemDB.id)
        .filter(
            TaskItemDB.task_id == task_id,
            TaskItemDB.status == CANONICALIZED_STATUS,
        )
        .all()
    }
    return ids - finalized


def reconcile_resubmitted_send_back_items(db: Session, task_id: str) -> int:
    """Restore annotated status after a send-back item has been resubmitted."""
    candidates = (
        db.query(TaskItemDB)
        .filter(
            TaskItemDB.task_id == task_id,
            # Only reconcile expert send-back items. Review adjustments/revisions
            # also persist as "returned" but must remain in the Returned queue.
            TaskItemDB.status == EXPERT_SEND_BACK_STATUS,
        )
        .all()
    )
    if not candidates:
        return 0

    now = datetime.now(UTC)
    updated = 0
    for item in candidates:
        send_back_at = _latest_send_back_at(db, task_id, item.id)
        if not _has_resubmitted_draft_after(db, item.id, send_back_at):
            continue
        item.status = TaskItemStatus.ANNOTATED.value
        item.updated_at = now
        updated += 1

    if updated:
        db.commit()
    return updated


def repair_expert_send_back_for_task(db: Session, task_id: str) -> int:
    """Persist ``expert_send_back`` for every collected send-back item."""
    item_ids = list(collect_expert_send_back_item_ids(db, task_id))
    if not item_ids:
        return 0

    now = datetime.now(UTC)
    updated = (
        db.query(TaskItemDB)
        .filter(
            TaskItemDB.id.in_(item_ids),
            TaskItemDB.status != CANONICALIZED_STATUS,
            TaskItemDB.status != EXPERT_SEND_BACK_STATUS,
        )
        .update(
            {TaskItemDB.status: EXPERT_SEND_BACK_STATUS, TaskItemDB.updated_at: now},
            synchronize_session=False,
        )
    )
    if updated:
        db.commit()
    return updated


def apply_expert_send_back_to_items(
    items: list[TaskItem],
    expert_ids: set[str],
) -> list[TaskItem]:
    """Ensure API read models expose expert send-back even if DB lagged."""
    if not expert_ids:
        return items
    result: list[TaskItem] = []
    for item in items:
        if item.id in expert_ids and item.status != TaskItemStatus.CANONICALIZED:
            result.append(
                item.model_copy(update={"status": TaskItemStatus.EXPERT_SEND_BACK}),
            )
        else:
            result.append(item)
    return result


def ensure_expert_send_back_status(db: Session, task_id: str, task_item_id: str) -> bool:
    """Force ``expert_send_back`` on one item after a send-back escalation decision."""
    item = (
        db.query(TaskItemDB)
        .filter(TaskItemDB.id == task_item_id, TaskItemDB.task_id == task_id)
        .first()
    )
    if item is None:
        return False
    if item.status == CANONICALIZED_STATUS:
        return False
    if item.status == EXPERT_SEND_BACK_STATUS:
        return True

    now = datetime.now(UTC)
    item.status = EXPERT_SEND_BACK_STATUS
    item.updated_at = now
    db.commit()
    return True


def _refresh_item_statuses_from_db(
    db: Session,
    task_id: str,
    items: list[TaskItem],
) -> list[TaskItem]:
    db_statuses = {
        row.id: row.status
        for row in db.query(TaskItemDB).filter(TaskItemDB.task_id == task_id).all()
    }
    refreshed: list[TaskItem] = []
    for item in items:
        db_status = db_statuses.get(item.id)
        if not db_status or db_status == item.status:
            refreshed.append(item)
            continue
        try:
            status = TaskItemStatus(db_status)
        except ValueError:
            refreshed.append(item)
            continue
        refreshed.append(item.model_copy(update={"status": status}))
    return refreshed


def list_task_items_with_send_back_resolution(
    db: Session,
    task_id: str,
    items: list[TaskItem],
) -> list[TaskItem]:
    """Repair DB rows and return items with effective expert send-back statuses."""
    reconcile_resubmitted_send_back_items(db, task_id)
    repair_expert_send_back_for_task(db, task_id)
    expert_ids = collect_expert_send_back_item_ids(db, task_id)
    refreshed_items = _refresh_item_statuses_from_db(db, task_id, items)
    return apply_expert_send_back_to_items(refreshed_items, expert_ids)


repair_legacy_expert_send_back_for_task = repair_expert_send_back_for_task
