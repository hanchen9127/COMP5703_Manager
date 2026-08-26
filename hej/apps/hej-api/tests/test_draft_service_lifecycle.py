"""Tests for draft lifecycle guards."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException

from app.services.draft_service import DraftService


def build_task_item_draft(*, draft_id: str = "draft_1", status: str = "pending") -> SimpleNamespace:
    return SimpleNamespace(
        id=draft_id,
        task_item_id="item_1",
        annotation_id=None,
        status=status,
        annotation_type="bbox",
        draft_data={},
        revision_notes=None,
        created_by=1,
        created_at=datetime.now(UTC),
        submitted_at=None,
        updated_at=None,
    )


class DraftServiceLifecycleTests(unittest.TestCase):
    def setUp(self) -> None:
        self.db = MagicMock()
        self.service = DraftService(db=self.db)
        self.service.db_store = MagicMock()
        self.service.db_store.drafts = MagicMock()
        self.service.db_store.annotations = MagicMock()
        self.service.db_store.task_items = MagicMock()

    def test_delete_draft_rejects_non_pending_statuses(self) -> None:
        for status in ("submitted", "approved"):
            with self.subTest(status=status):
                draft = build_task_item_draft(status=status)
                with patch.object(self.service, "get_draft", return_value=draft):
                    with self.assertRaises(HTTPException) as exc:
                        self.service.delete_draft(draft.id)

                self.assertEqual(exc.exception.status_code, 409)

    def test_approve_draft_rejects_non_submitted_statuses(self) -> None:
        for status in ("pending", "approved"):
            with self.subTest(status=status):
                draft = build_task_item_draft(status=status)
                with patch.object(self.service, "get_draft", return_value=draft):
                    with self.assertRaises(HTTPException) as exc:
                        self.service.approve_draft(draft.id)

                self.assertEqual(exc.exception.status_code, 409)

    def test_delete_draft_allows_pending_and_deletes(self) -> None:
        draft = build_task_item_draft(status="pending")
        self.service.db_store.drafts.delete.return_value = True

        with patch.object(self.service, "get_draft", return_value=draft):
            result = self.service.delete_draft(draft.id)

        self.assertTrue(result)
        self.service.db_store.drafts.delete.assert_called_once_with(draft.id)

    def test_submit_draft_skips_status_update_when_disputed(self) -> None:
        from app.models import TaskItem, TaskItemStatus

        draft = build_task_item_draft(status="pending")
        self.service.db_store.drafts.update.return_value = draft
        self.service.db_store.task_items.get.return_value = TaskItem(
            id="item_1",
            task_id="task_1",
            data_pointer_id="ptr",
            external_item_ref="ext",
            status=TaskItemStatus.DISPUTED,
        )

        with patch.object(self.service, "get_draft", return_value=draft), patch.object(
            self.service, "_create_annotation_from_draft", return_value=MagicMock()
        ):
            self.service.submit_draft(draft.id)

        self.service.db_store.task_items.update.assert_not_called()

    def test_submit_draft_advances_expert_send_back_to_annotated(self) -> None:
        from app.models import TaskItem, TaskItemStatus

        draft = build_task_item_draft(status="pending")
        self.service.db_store.drafts.update.return_value = draft
        self.service.db_store.task_items.get.return_value = TaskItem(
            id="item_1",
            task_id="task_1",
            data_pointer_id="ptr",
            external_item_ref="ext",
            status=TaskItemStatus.EXPERT_SEND_BACK,
        )

        with patch.object(self.service, "get_draft", return_value=draft), patch.object(
            self.service, "_create_annotation_from_draft", return_value=MagicMock()
        ):
            self.service.submit_draft(draft.id)

        self.service.db_store.task_items.update.assert_called_once_with(
            "item_1",
            status=TaskItemStatus.ANNOTATED,
        )


if __name__ == "__main__":
    unittest.main()
