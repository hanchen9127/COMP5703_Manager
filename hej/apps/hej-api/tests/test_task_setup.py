"""Tests for task setup read model and data pointer listing."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

from app.models import AnnotationMode, DataPointer, Task, TaskItem, TaskItemStatus, TaskStatus, TaskType
from app.schemas.task_setup import TaskSetupRead
from app.services.task_setup_service import (
    TaskSetupService,
    data_pointer_to_read,
    infer_storage_provider_hint,
    registration_status,
    task_item_to_read,
)


class TaskSetupHelpersTests(unittest.TestCase):
    def test_registration_status_pending(self) -> None:
        self.assertEqual(registration_status(0, 0), "pending_registration")

    def test_registration_status_registered(self) -> None:
        self.assertEqual(registration_status(2, 2), "registered")

    def test_registration_status_partial(self) -> None:
        self.assertEqual(registration_status(1, 0), "partial")
        self.assertEqual(registration_status(0, 1), "partial")

    def test_infer_storage_provider_hint(self) -> None:
        self.assertEqual(
            infer_storage_provider_hint(["s3://bucket/key.json"]),
            "AWS S3",
        )
        self.assertEqual(
            infer_storage_provider_hint(["mock://demo/item-1"]),
            "Mock storage",
        )
        self.assertIsNone(infer_storage_provider_hint([]))

    def test_data_pointer_to_read(self) -> None:
        created = datetime(2026, 5, 17, tzinfo=UTC)
        pointer = DataPointer(
            id="ptr_1",
            task_id="task_1",
            location_ref="s3://bucket/a.json",
            access_policy_ref="ap_1",
            source_version_ref="v1",
            created_at=created,
        )
        read = data_pointer_to_read(pointer)
        self.assertEqual(read.id, "ptr_1")
        self.assertEqual(read.location_ref, "s3://bucket/a.json")

    def test_task_item_to_read_includes_location_ref(self) -> None:
        item = TaskItem(
            id="item_1",
            task_id="task_1",
            data_pointer_id="ptr_1",
            external_item_ref="ext-1",
            location_ref="s3://bucket/a.json",
            status=TaskItemStatus.PENDING,
            payload_preview={"preview": "x"},
        )
        read = task_item_to_read(item)
        self.assertEqual(read.location_ref, "s3://bucket/a.json")


class TaskSetupServiceTests(unittest.TestCase):
    def test_build_setup_read_aggregates_task_policy_and_data_plane(self) -> None:
        task = Task(
            id="task_setup_1",
            project_id="proj_1",
            title="Setup task",
            description=None,
            judgment_question="Is this valid?",
            task_type=TaskType.TEXT,
            annotation_mode=AnnotationMode.HUMAN_FIRST,
            label_schema_ref="schema_test_v1",
            review_policy_ref="review_dual_signoff_v1",
            status=TaskStatus.DRAFT,
        )
        pointer = DataPointer(
            id="ptr_1",
            task_id="task_setup_1",
            location_ref="s3://bucket/item.json",
        )
        item = TaskItem(
            id="item_1",
            task_id="task_setup_1",
            data_pointer_id="ptr_1",
            external_item_ref="row-1",
            location_ref="s3://bucket/item.json",
            status=TaskItemStatus.PENDING,
            payload_preview={},
        )
        resolved = MagicMock()
        resolved.to_dict.return_value = {
            "label_schema_ref": "schema_test_v1",
            "review_policy_ref": "review_dual_signoff_v1",
            "review_mode": "dual_signoff",
            "review_required_approvals": 2,
            "review_dual_sign_off": True,
            "dispute_policy_ref": None,
            "dispute_escalation_gate": "required",
            "dispute_escalation_threshold": 1,
            "dispute_inherited_from_org": True,
            "export_policy_ref": None,
            "export_provenance_required": True,
            "export_retention_days": 90,
            "export_inherited_from_org": True,
            "annotation_mode": "human_first",
            "rules_summary": [],
        }

        mock_service = MagicMock()
        mock_service.get_task.return_value = task
        mock_service.list_task_items.return_value = [item]
        mock_service.db_pointer_repo = MagicMock()
        mock_service.db_pointer_repo.list_by_task.return_value = [pointer]
        mock_service.data_pointer_repository = None

        with (
            patch("app.services.task_setup_service.TaskService", return_value=mock_service),
            patch(
                "app.services.task_setup_service.resolve_for_task",
                return_value=resolved,
            ),
        ):
            result = TaskSetupService.build_setup_read(MagicMock(), "task_setup_1")

        self.assertIsInstance(result, TaskSetupRead)
        self.assertEqual(result.task.id, "task_setup_1")
        self.assertEqual(len(result.data_pointers), 1)
        self.assertEqual(len(result.task_items), 1)
        self.assertEqual(result.data_plane.pointer_count, 1)
        self.assertEqual(result.data_plane.item_count, 1)
        self.assertEqual(result.data_plane.registration_status, "registered")
        self.assertEqual(result.data_plane.storage_provider_hint, "AWS S3")
        self.assertEqual(result.resolved_policy.review_mode, "dual_signoff")

    def test_list_data_pointers_returns_read_models(self) -> None:
        task = Task(
            id="task_ptr",
            project_id="proj_1",
            title="T",
            description=None,
            judgment_question="Q?",
            task_type=TaskType.TEXT,
            annotation_mode=AnnotationMode.HUMAN_FIRST,
            label_schema_ref="schema_test_v1",
            status=TaskStatus.DRAFT,
        )
        pointer = DataPointer(
            id="ptr_a",
            task_id="task_ptr",
            location_ref="mock://demo",
        )
        mock_service = MagicMock()
        mock_service.get_task.return_value = task
        mock_service.db_pointer_repo = MagicMock()
        mock_service.db_pointer_repo.list_by_task.return_value = [pointer]
        mock_service.data_pointer_repository = None

        with patch("app.services.task_setup_service.TaskService", return_value=mock_service):
            reads = TaskSetupService.list_data_pointers(MagicMock(), "task_ptr")

        self.assertEqual(len(reads), 1)
        self.assertEqual(reads[0].id, "ptr_a")
        self.assertEqual(reads[0].location_ref, "mock://demo")


if __name__ == "__main__":
    unittest.main()
