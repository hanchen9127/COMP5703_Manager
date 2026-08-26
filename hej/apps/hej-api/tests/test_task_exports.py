"""Tests for task export normalization."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime
from types import SimpleNamespace

from app.api.routes.tasks import (
    _finalization_export_block,
    _latest_resolved_escalations_by_item,
    _normalize_text_annotation,
)


class TaskExportFinalizationTests(unittest.TestCase):
    def test_latest_resolved_escalation_per_item(self) -> None:
        older = SimpleNamespace(
            task_item_id="item_a",
            decided_at=datetime(2026, 5, 27, 10, 0, 0, tzinfo=UTC),
        )
        newer = SimpleNamespace(
            task_item_id="item_a",
            decided_at=datetime(2026, 5, 28, 10, 0, 0, tzinfo=UTC),
        )
        other = SimpleNamespace(
            task_item_id="item_b",
            decided_at=datetime(2026, 5, 28, 11, 0, 0, tzinfo=UTC),
        )

        latest = _latest_resolved_escalations_by_item([newer, older, other])

        self.assertIs(latest["item_a"], newer)
        self.assertIs(latest["item_b"], other)

    def test_finalization_export_block_includes_decision_note(self) -> None:
        escalation = SimpleNamespace(
            id="esc_1",
            decision="finalize",
            decision_note="xxxxxxxx",
            decided_at=datetime(2026, 5, 28, 1, 45, 15, tzinfo=UTC),
            decided_by=1,
            note="routed context",
            routed_at=datetime(2026, 5, 28, 1, 30, 0, tzinfo=UTC),
            target="secondary_reviewer",
        )
        user = SimpleNamespace(id=1, name="Alice Chen", email="alice@example.com")

        block = _finalization_export_block(escalation, {1: user})

        self.assertIsNotNone(block)
        assert block is not None
        self.assertEqual(block["decision_note"], "xxxxxxxx")
        self.assertEqual(block["decision"], "finalize")
        self.assertEqual(block["routed_note"], "routed context")
        self.assertEqual(block["decided_by"]["email"], "alice@example.com")

    def test_finalization_export_block_none_without_escalation(self) -> None:
        self.assertIsNone(_finalization_export_block(None, {}))


class TaskExportNormalizationTests(unittest.TestCase):
    def test_normalized_text_annotation_preserves_spans_and_labels(self) -> None:
        normalized = _normalize_text_annotation(
            {
                "output": {
                    "text": "hello",
                    "text_spans": [{"start": 0, "end": 5, "label": "greeting"}],
                    "labels": ["greeting", "salutation"],
                    "notes": "keep spans",
                }
            }
        )

        self.assertEqual(normalized["modality"], "text")
        self.assertEqual(normalized["value"]["text"], "hello")
        self.assertEqual(
            normalized["value"]["text_spans"],
            [{"start": 0, "end": 5, "label": "greeting"}],
        )
        self.assertEqual(normalized["value"]["labels"], ["greeting", "salutation"])
        self.assertEqual(normalized["value"]["notes"], "keep spans")


if __name__ == "__main__":
    unittest.main()
