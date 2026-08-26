"""Tests for task completion endpoint and service guard logic."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi import HTTPException

from app.api.routes.tasks import complete_task as complete_task_route
from app.models import AnnotationMode, Task, TaskItem, TaskStatus, TaskType
from app.services.task_service import TaskService


def build_task(
    *,
    task_id: str = "task_1",
    project_id: str = "proj_1",
    status: TaskStatus = TaskStatus.READY,
) -> Task:
    return Task(
        id=task_id,
        project_id=project_id,
        title="Completion test task",
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


def build_item(*, item_id: str, status: str) -> TaskItem:
    return TaskItem(
        id=item_id,
        task_id="task_1",
        data_pointer_id=f"ptr_{item_id}",
        external_item_ref=item_id,
        location_ref="mock://fixtures/text/item.json",
        status=status,  # type: ignore[arg-type]
        payload_preview={},
        created_at=datetime.now(UTC),
    )


class TaskCompletionServiceTests(unittest.TestCase):
    def _build_service(self) -> TaskService:
        service = TaskService()
        service.db_task_repo = Mock()
        service.db_item_repo = Mock()
        service.db = None
        return service

    def test_complete_task_succeeds_when_all_items_are_finalized(self) -> None:
        service = self._build_service()
        task = build_task()
        items = [
            build_item(item_id="item_1", status="reviewed"),
            build_item(item_id="item_2", status="canonicalized"),
        ]
        updated_task = build_task(status=TaskStatus.COMPLETED)

        service.db_task_repo.get.return_value = task
        service.db_task_repo.update.return_value = updated_task
        service.db_item_repo.list_by_task.return_value = items

        result = service.complete_task("task_1", operator_id=123)

        self.assertEqual(result.status, TaskStatus.COMPLETED)
        service.db_task_repo.update.assert_called_once_with("task_1", status="completed")

    def test_complete_task_rejects_empty_task(self) -> None:
        service = self._build_service()
        task = build_task()

        service.db_task_repo.get.return_value = task
        service.db_item_repo.list_by_task.return_value = []

        with self.assertRaises(HTTPException) as exc:
            service.complete_task("task_1", operator_id=123)

        self.assertEqual(exc.exception.status_code, 409)
        self.assertNotEqual(getattr(task, "status", None), TaskStatus.COMPLETED)
        service.db_task_repo.update.assert_not_called()

    def test_complete_task_rejects_when_any_item_is_unfinished(self) -> None:
        service = self._build_service()
        task = build_task()
        items = [
            SimpleNamespace(status="reviewed"),
            SimpleNamespace(status="submitted"),
        ]

        service.db_task_repo.get.return_value = task
        service.db_item_repo.list_by_task.return_value = items

        with self.assertRaises(HTTPException) as exc:
            service.complete_task("task_1", operator_id=123)

        self.assertEqual(exc.exception.status_code, 409)
        service.db_task_repo.update.assert_not_called()


class TaskCompletionRouteTests(unittest.TestCase):
    def test_complete_task_returns_404_when_task_does_not_belong_to_project(self) -> None:
        fake_task = SimpleNamespace(id="task_1", project_id="proj_other")
        fake_service = Mock()
        fake_service.get_task.return_value = fake_task

        with patch("app.api.routes.tasks.verify_user_is_active") as verify_active, patch(
            "app.api.routes.tasks.verify_user_task_access"
        ) as verify_access, patch("app.api.routes.tasks.TaskService", return_value=fake_service):
            verify_active.return_value = None
            verify_access.return_value = None

            with self.assertRaises(HTTPException) as exc:
                complete_task_route(
                    project_id="proj_1",
                    task_id="task_1",
                    current_user={"user_id": 1, "email": "test@example.com"},
                    db=Mock(),
                )

        self.assertEqual(exc.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
