"""Tests for task history audit query and workflow lineage."""

from datetime import UTC, datetime
from unittest.mock import MagicMock

from app.models import AnnotationMode, Task, TaskStatus, TaskType
from app.services.task_audit_log_query import category_for_operation
from app.services.task_history_recorder import OPERATION_CATEGORIES
from app.services.task_workflow_service import TaskWorkflowService


def test_category_for_operation_maps_known_ops():
    assert category_for_operation("policy_updated") == "policy"
    assert category_for_operation("review_action") == "review"
    assert category_for_operation("unknown_op") == "system"


def test_all_operations_have_categories():
    for operation in OPERATION_CATEGORIES:
        assert category_for_operation(operation) in {
            "setup",
            "policy",
            "data",
            "annotation",
            "review",
            "dispute",
            "system",
        }


def test_workflow_lineage_draft_task_no_items():
    db = MagicMock()
    db.query.return_value.filter.return_value.count.return_value = 0
    status_query = MagicMock()
    status_query.filter.return_value.all.return_value = []
    db.query.side_effect = lambda model: status_query

    task = Task(
        id="task_test",
        project_id="proj_test",
        title="Test",
        description=None,
        judgment_question="Q?",
        task_type=TaskType.TEXT,
        annotation_mode=AnnotationMode.HUMAN_FIRST,
        label_schema_ref="schema_test_v1",
        review_policy_ref="review_dual_signoff_v1",
        status=TaskStatus.DRAFT,
    )

    lineage = TaskWorkflowService.build_lineage(db, task)
    assert lineage.task_id == "task_test"
    assert lineage.item_counts.total == 0
    assert lineage.steps[0].key == "task_setup"
    assert lineage.steps[0].state == "in_progress"
    assert lineage.current_step_key == "task_setup"
    assert lineage.headline
    in_progress = [s for s in lineage.steps if s.state == "in_progress"]
    assert len(in_progress) == 1


def test_workflow_lineage_single_current_step_when_active():
    db = MagicMock()
    db.query.return_value.filter.return_value.count.return_value = 0
    status_query = MagicMock()
    status_query.filter.return_value.all.return_value = [
        ("pending",),
        ("pending",),
        ("reviewed",),
    ]
    db.query.side_effect = lambda model: status_query

    task = Task(
        id="task_active",
        project_id="proj_test",
        title="Active",
        description=None,
        judgment_question="Q?",
        task_type=TaskType.TEXT,
        annotation_mode=AnnotationMode.HUMAN_FIRST,
        label_schema_ref="schema_test_v1",
        review_policy_ref="review_dual_signoff_v1",
        status=TaskStatus.READY,
    )

    lineage = TaskWorkflowService.build_lineage(db, task)
    assert lineage.current_step_key == "first_pass_work"
    in_progress = [s for s in lineage.steps if s.state == "in_progress"]
    blocked = [s for s in lineage.steps if s.state == "blocked"]
    assert len(in_progress) + len(blocked) == 1
