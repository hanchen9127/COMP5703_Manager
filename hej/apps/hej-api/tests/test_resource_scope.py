"""Tests for resource scope missing-resource guards."""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock

from fastapi import HTTPException

from app.core.resource_scope import (
    verify_user_annotation_access,
    verify_user_draft_access,
    verify_user_review_access,
    verify_user_task_item_access,
)


class ResourceScopeMissingResourceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.current_user = {
            "user_id": 1,
            "org_contexts": [{"organization_id": 10, "roles": ["annotator"]}],
        }
        self.db = MagicMock()
        self.db.query.return_value.filter.return_value.first.return_value = None

    def test_verify_user_task_item_access_missing_item_raises_404(self) -> None:
        with self.assertRaises(HTTPException) as exc:
            verify_user_task_item_access(self.current_user, "missing_item", self.db)

        self.assertEqual(exc.exception.status_code, 404)
        self.assertTrue(self.db.query.called)

    def test_verify_user_draft_access_missing_draft_raises_404(self) -> None:
        with self.assertRaises(HTTPException) as exc:
            verify_user_draft_access(self.current_user, "missing_draft", self.db)

        self.assertEqual(exc.exception.status_code, 404)
        self.assertTrue(self.db.query.called)

    def test_verify_user_annotation_access_missing_annotation_raises_404(self) -> None:
        with self.assertRaises(HTTPException) as exc:
            verify_user_annotation_access(self.current_user, "missing_annotation", self.db)

        self.assertEqual(exc.exception.status_code, 404)
        self.assertTrue(self.db.query.called)

    def test_verify_user_review_access_missing_review_raises_404(self) -> None:
        with self.assertRaises(HTTPException) as exc:
            verify_user_review_access(self.current_user, "missing_review", self.db)

        self.assertEqual(exc.exception.status_code, 404)
        self.assertTrue(self.db.query.called)


if __name__ == "__main__":
    unittest.main()
