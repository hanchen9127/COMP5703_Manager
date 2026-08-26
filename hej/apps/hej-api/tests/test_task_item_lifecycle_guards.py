"""Tests for task item lifecycle guards."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime

from fastapi import HTTPException

from app.models import AnnotationMode, Task, TaskItem, TaskItemStatus, TaskStatus, TaskType
from app.services.task_service import assert_task_item_status_update_allowed


def build_task(status: TaskStatus) -> Task:
    return Task(
        id="task_1",
        project_id="proj_1",
        title="Task item guard task",
        description=None,
        judgment_question="Is this valid?",
        task_type=TaskType.TEXT,
        annotation_mode=AnnotationMode.HUMAN_FIRST,
        label_schema_ref="schema_test_v1",
        review_policy_ref=None,
        dispute_policy_ref=None,
        export_policy_ref=None,
        status=status,
        created_at=datetime.now(UTC),
    )


def build_task_item(status: TaskItemStatus) -> TaskItem:
    return TaskItem(
        id="item_1",
        task_id="task_1",
        data_pointer_id="ptr_1",
        external_item_ref="ext-1",
        location_ref="mock://fixtures/text/item_001.json",
        status=status,
        payload_preview={},
        created_at=datetime.now(UTC),
    )


class TaskItemLifecycleGuardTests(unittest.TestCase):
    def test_rejects_when_parent_task_is_completed(self) -> None:
        task = build_task(TaskStatus.COMPLETED)
        task_item = build_task_item(TaskItemStatus.PENDING)

        with self.assertRaises(HTTPException) as exc:
            assert_task_item_status_update_allowed(task, task_item, TaskItemStatus.PENDING)

        self.assertEqual(exc.exception.status_code, 409)

    def test_rejects_when_current_item_is_canonicalized(self) -> None:
        task = build_task(TaskStatus.READY)
        task_item = build_task_item(TaskItemStatus.CANONICALIZED)

        with self.assertRaises(HTTPException) as exc:
            assert_task_item_status_update_allowed(task, task_item, TaskItemStatus.PENDING)

        self.assertEqual(exc.exception.status_code, 409)

    def test_rejects_workflow_owned_status_writes(self) -> None:
        task = build_task(TaskStatus.READY)
        task_item = build_task_item(TaskItemStatus.PENDING)

        for next_status in (
            TaskItemStatus.ANNOTATED,
            TaskItemStatus.RETURNED,
            TaskItemStatus.REJECTED,
            TaskItemStatus.REVIEWED,
            TaskItemStatus.DISPUTED,
            TaskItemStatus.EXPERT_SEND_BACK,
            TaskItemStatus.CANONICALIZED,
        ):
            with self.subTest(next_status=next_status):
                with self.assertRaises(HTTPException) as exc:
                    assert_task_item_status_update_allowed(task, task_item, next_status)

                self.assertEqual(exc.exception.status_code, 409)

    def test_allows_pending_to_pending_when_task_not_completed(self) -> None:
        task = build_task(TaskStatus.READY)
        task_item = build_task_item(TaskItemStatus.PENDING)

        assert_task_item_status_update_allowed(task, task_item, TaskItemStatus.PENDING)


if __name__ == "__main__":
    unittest.main()
