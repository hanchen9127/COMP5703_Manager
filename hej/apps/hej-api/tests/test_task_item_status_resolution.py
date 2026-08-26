"""Tests for expert send-back status repair."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime
from unittest.mock import MagicMock

from app.models import TaskItem, TaskItemStatus
from app.services.task_item_status_resolution import (
    apply_expert_send_back_to_items,
    collect_expert_send_back_item_ids,
    ensure_expert_send_back_status,
    repair_expert_send_back_for_task,
)


class CollectExpertSendBackTests(unittest.TestCase):
    def test_uses_latest_resolved_send_back_decision(self) -> None:
        db = MagicMock()
        esc = MagicMock()
        esc.task_item_id = "item_a"
        esc.decision = "send_back"
        esc.decided_at = datetime(2026, 5, 27, 10, 0, tzinfo=UTC)
        db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [
            esc
        ]
        db.query.return_value.filter.return_value.all.return_value = []

        with (
            unittest.mock.patch(
                "app.services.task_item_status_resolution._audit_send_back_timestamps",
                return_value={},
            ),
            unittest.mock.patch(
                "app.services.task_item_status_resolution._has_resubmitted_draft_after",
                return_value=False,
            ),
        ):
            ids = collect_expert_send_back_item_ids(db, "task_1")

        self.assertEqual(ids, {"item_a"})

    def test_audit_send_back_merged_even_when_escalation_row_differs(self) -> None:
        db = MagicMock()
        esc = MagicMock()
        esc.task_item_id = "item_a"
        esc.decision = "finalize"
        db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [
            esc
        ]
        db.query.return_value.filter.return_value.all.return_value = []

        with (
            unittest.mock.patch(
                "app.services.task_item_status_resolution._audit_send_back_timestamps",
                return_value={"item_a": datetime(2026, 5, 27, 10, 0, tzinfo=UTC)},
            ),
            unittest.mock.patch(
                "app.services.task_item_status_resolution._has_resubmitted_draft_after",
                return_value=False,
            ),
        ):
            ids = collect_expert_send_back_item_ids(db, "task_1")

        self.assertEqual(ids, {"item_a"})

    def test_excludes_items_resubmitted_after_send_back(self) -> None:
        db = MagicMock()
        esc = MagicMock()
        esc.task_item_id = "item_a"
        esc.decision = "send_back"
        esc.decided_at = datetime(2026, 5, 27, 10, 0, tzinfo=UTC)
        db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [
            esc
        ]
        db.query.return_value.filter.return_value.all.return_value = []

        with (
            unittest.mock.patch(
                "app.services.task_item_status_resolution._audit_send_back_timestamps",
                return_value={},
            ),
            unittest.mock.patch(
                "app.services.task_item_status_resolution._has_resubmitted_draft_after",
                return_value=True,
            ),
        ):
            ids = collect_expert_send_back_item_ids(db, "task_1")

        self.assertEqual(ids, set())


class RepairExpertSendBackTests(unittest.TestCase):
    def test_repairs_collected_items(self) -> None:
        db = MagicMock()
        with unittest.mock.patch(
            "app.services.task_item_status_resolution.collect_expert_send_back_item_ids",
            return_value={"item_a"},
        ):
            update_query = MagicMock()
            db.query.return_value.filter.return_value.update.return_value = 1
            count = repair_expert_send_back_for_task(db, "task_1")

        self.assertEqual(count, 1)
        db.commit.assert_called_once()


class ApplyExpertSendBackToItemsTests(unittest.TestCase):
    def test_overlays_status_on_read_model(self) -> None:
        items = [
            TaskItem(
                id="item_a",
                task_id="task_1",
                data_pointer_id="ptr",
                external_item_ref="ext",
                status=TaskItemStatus.ANNOTATED,
            ),
        ]
        out = apply_expert_send_back_to_items(items, {"item_a"})
        self.assertEqual(out[0].status, TaskItemStatus.EXPERT_SEND_BACK)


class EnsureExpertSendBackStatusTests(unittest.TestCase):
    def test_upgrades_annotated_item(self) -> None:
        db = MagicMock()
        item = MagicMock()
        item.status = "annotated"
        db.query.return_value.filter.return_value.first.return_value = item

        changed = ensure_expert_send_back_status(db, "task_1", "item_a")

        self.assertTrue(changed)
        self.assertEqual(item.status, "expert_send_back")
        db.commit.assert_called_once()

class ReconcileResubmittedSendBackTests(unittest.TestCase):
    def test_does_not_reconcile_review_returned_items(self) -> None:
        from app.services.task_item_status_resolution import reconcile_resubmitted_send_back_items

        db = MagicMock()
        # Simulate a review-adjusted item stored as "returned" (not expert_send_back).
        db.query.return_value.filter.return_value.all.return_value = []

        count = reconcile_resubmitted_send_back_items(db, "task_1")

        self.assertEqual(count, 0)
        db.commit.assert_not_called()

if __name__ == "__main__":
    unittest.main()
