"""Tests for task audit log enrichment (summary/detail and item labels)."""

from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock

from app.models.db_models import AuditLogDB
from app.services.task_audit_log_query import (
    TaskAuditLogQueryService,
    _build_changes,
    _detail_for_log,
    _merge_legacy_data_intake_duplicates,
    _summary_for_log,
)


def _log(
    *,
    operation: str,
    description: str | None = None,
    new_values: str | None = None,
    resource_type: str = "task_item",
    resource_id: str = "item_abc",
) -> AuditLogDB:
    return AuditLogDB(
        id=1,
        resource_type=resource_type,
        resource_id=resource_id,
        operation=operation,
        operator_id=7,
        old_values=None,
        new_values=new_values,
        description=description,
        project_id="proj_1",
        task_id="task_1",
        created_at=datetime.now(UTC),
    )


def test_build_changes_skips_internal_draft_id():
    changes = _build_changes("draft_submitted", {}, {"draft_id": "draft_abc"})
    assert changes == []


def test_build_changes_skips_data_intake_counters():
    changes = _build_changes(
        "dataset_registered",
        {},
        {"item_count": 1, "file_count": 1},
    )
    assert changes == []


def test_build_changes_keeps_operator_visible_fields():
    changes = _build_changes(
        "draft_submitted",
        {"status": "pending"},
        {"status": "submitted", "draft_id": "draft_x"},
    )
    assert len(changes) == 1
    assert changes[0].field == "status"
    assert changes[0].before == "pending"
    assert changes[0].after == "submitted"


def test_dataset_registered_summary_user_facing():
    log = _log(
        operation="dataset_registered",
        description="527txt3.txt",
        new_values='{"intake_source": "text_upload", "item_names": ["527txt3.txt"]}',
        resource_type="task_item",
        resource_id="item_abc",
    )
    new_values = {"intake_source": "text_upload", "item_names": ["527txt3.txt"]}
    summary = _summary_for_log(log, new_values)
    assert summary == "Added 1 text item to queue"
    assert _detail_for_log(log, summary, new_values) == "527txt3.txt"


def test_merge_legacy_duplicate_upload_pair():
    ts = datetime.now(UTC)
    upload = AuditLogDB(
        id=1,
        resource_type="task",
        resource_id="task_1",
        operation="files_uploaded",
        operator_id=7,
        description="Registered 1 task items from text upload",
        new_values='{"item_count": 1}',
        project_id="proj_1",
        task_id="task_1",
        created_at=ts,
    )
    register = AuditLogDB(
        id=2,
        resource_type="task",
        resource_id="task_1",
        operation="dataset_registered",
        operator_id=7,
        description="Created 1 data pointers and 1 task items",
        new_values='{"item_count": 1}',
        project_id="proj_1",
        task_id="task_1",
        created_at=ts,
    )
    merged = _merge_legacy_data_intake_duplicates([upload, register])
    assert len(merged) == 1
    assert merged[0].operation == "dataset_registered"


def test_escalation_routed_summary_not_duplicated_in_detail():
    log = _log(
        operation="escalation_routed",
        description="Escalation routed to secondary_reviewer",
        new_values='{"target": "secondary_reviewer"}',
    )
    summary = _summary_for_log(log, {"target": "secondary_reviewer"})
    assert summary == "Escalation routed to secondary_reviewer"
    assert _detail_for_log(log, summary, {"target": "secondary_reviewer"}) is None


def test_escalation_routed_user_note_becomes_detail():
    log = _log(
        operation="escalation_routed",
        description="Boundary disagreement on span offsets",
        new_values='{"target": "secondary_reviewer"}',
    )
    summary = _summary_for_log(log, {"target": "secondary_reviewer"})
    assert summary == "Escalation routed to secondary_reviewer"
    assert (
        _detail_for_log(log, summary, {"target": "secondary_reviewer"})
        == "Boundary disagreement on span offsets"
    )


def test_list_for_task_attaches_external_item_ref_label():
    log = _log(operation="escalation_routed", new_values='{"target": "secondary_reviewer"}')
    task_item = SimpleNamespace(id="item_abc", external_item_ref="527txt2.txt")
    user = SimpleNamespace(id=7, name="Alice Chen", email="alice@example.com")

    db = MagicMock()
    audit_query = MagicMock()
    audit_query.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [
        log
    ]
    audit_query.filter.return_value.count.return_value = 1

    item_query = MagicMock()
    item_query.filter.return_value.all.return_value = [task_item]

    user_query = MagicMock()
    user_query.filter.return_value.all.return_value = [user]

    def query_side_effect(model):
        if model is AuditLogDB:
            return audit_query
        if getattr(model, "__name__", "") == "TaskItemDB":
            return item_query
        return user_query

    db.query.side_effect = query_side_effect

    response = TaskAuditLogQueryService.list_for_task(
        db,
        "task_1",
        project_id="proj_1",
        limit=10,
        offset=0,
    )

    assert response.logs[0].resource is not None
    assert response.logs[0].resource.label == "527txt2.txt"
    assert response.logs[0].detail is None
    assert response.logs[0].changes == []
