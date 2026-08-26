"""Tests for the dataset intake lifecycle guard."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime

from fastapi import HTTPException

from app.models import AnnotationMode, Task, TaskStatus, TaskType
from app.services.task_service import assert_task_allows_dataset_intake


def build_task(status: TaskStatus) -> Task:
    return Task(
        id="task_1",
        project_id="proj_1",
        title="Dataset intake guard task",
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


class DatasetIntakeLifecycleGuardTests(unittest.TestCase):
    def test_allows_draft_and_ready(self) -> None:
        for status in (TaskStatus.DRAFT, TaskStatus.READY):
            with self.subTest(status=status):
                assert_task_allows_dataset_intake(build_task(status))

    def test_rejects_in_review_disputed_and_completed(self) -> None:
        for status in (TaskStatus.IN_REVIEW, TaskStatus.DISPUTED, TaskStatus.COMPLETED):
            with self.subTest(status=status):
                with self.assertRaises(HTTPException) as exc:
                    assert_task_allows_dataset_intake(build_task(status))

                self.assertEqual(exc.exception.status_code, 409)
                self.assertIn("draft or ready", exc.exception.detail)


if __name__ == "__main__":
    unittest.main()
