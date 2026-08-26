"""Tests for operator-facing task history copy."""

from __future__ import annotations

import unittest

from app.services.task_history_copy import (
    build_data_intake_audit_copy,
    normalize_legacy_data_intake_copy,
)


class TaskHistoryCopyTests(unittest.TestCase):
    def test_single_text_upload_copy(self) -> None:
        summary, detail = build_data_intake_audit_copy(
            item_count=1,
            intake_source="text_upload",
            item_names=["527txt3.txt"],
        )
        self.assertEqual(summary, "Added 1 text item to queue")
        self.assertEqual(detail, "527txt3.txt")

    def test_multi_text_upload_lists_files(self) -> None:
        summary, detail = build_data_intake_audit_copy(
            item_count=2,
            intake_source="text_upload",
            item_names=["a.txt", "b.txt"],
        )
        self.assertEqual(summary, "Added 2 text items to queue")
        self.assertEqual(detail, "a.txt, b.txt")

    def test_legacy_duplicate_upload_description(self) -> None:
        summary, detail = normalize_legacy_data_intake_copy(
            "files_uploaded",
            "Registered 1 task items from text upload",
            {"item_count": 1, "file_count": 1},
        )
        self.assertEqual(summary, "Added 1 text item to queue")
        self.assertIsNone(detail)

    def test_legacy_created_pointers_description(self) -> None:
        summary, detail = normalize_legacy_data_intake_copy(
            "dataset_registered",
            "Created 1 data pointers and 1 task items",
            {"item_count": 1},
        )
        self.assertEqual(summary, "Registered 1 item from dataset")
        self.assertIsNone(detail)

    def test_new_format_stores_filename_in_description(self) -> None:
        summary, detail = normalize_legacy_data_intake_copy(
            "dataset_registered",
            "527txt3.txt",
            {"intake_source": "text_upload", "item_names": ["527txt3.txt"]},
        )
        self.assertEqual(summary, "Added 1 text item to queue")
        self.assertEqual(detail, "527txt3.txt")


if __name__ == "__main__":
    unittest.main()
