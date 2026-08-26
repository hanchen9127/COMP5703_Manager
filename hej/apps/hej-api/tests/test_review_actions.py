"""Tests for task-item review actions."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi import HTTPException

from app.api.routes.review_actions import (
    _map_action_to_next_ui_status,
    _map_action_to_task_item_status,
    _map_escalation_decision_to_task_item_status,
    submit_task_item_review_action,
)


class ReviewActionRegressionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.current_user = {
            "user_id": 7,
            "email": "reviewer@example.com",
            "org_contexts": [{"organization_id": 10, "roles": ["reviewer"]}],
        }
        self.db = Mock()
        self.db.add = Mock()
        self.db.flush = Mock()
        self.db.commit = Mock()
        self.db.refresh = Mock()

    def _build_task(self) -> SimpleNamespace:
        return SimpleNamespace(id="task_1", project_id="proj_1")

    def _build_item(self) -> SimpleNamespace:
        return SimpleNamespace(
            id="item_1",
            task_id="task_1",
            status="reviewed",
            updated_at=datetime.now(UTC),
        )

    def _build_annotation(self) -> SimpleNamespace:
        return SimpleNamespace(id="annotation_1")

    def test_dual_signoff_accept_maps_final_approval_to_canonicalized(self) -> None:
        self.assertEqual(_map_action_to_task_item_status("accept"), "canonicalized")

    def test_reject_maps_to_rejected(self) -> None:
        self.assertEqual(_map_action_to_task_item_status("reject"), "rejected")
        self.assertEqual(_map_action_to_next_ui_status("reject"), "rejected")

    def test_adjust_and_revise_map_to_returned(self) -> None:
        self.assertEqual(_map_action_to_task_item_status("adjust"), "returned")
        self.assertEqual(_map_action_to_task_item_status("revise"), "returned")
        self.assertEqual(_map_action_to_next_ui_status("adjust"), "returned")

    def test_submit_review_action_final_approval_canonicalizes_item(self) -> None:
        task = self._build_task()
        item = self._build_item()
        annotation = self._build_annotation()

        review_row = SimpleNamespace(id="review_1", review_status="approved")

        with patch("app.api.routes.review_actions.verify_user_is_active", return_value=1), patch(
            "app.api.routes.review_actions.TaskService.get_task",
            return_value=task,
        ), patch(
            "app.api.routes.review_actions.verify_user_task_access",
            return_value=True,
        ), patch(
            "app.api.routes.review_actions._load_task_item",
            return_value=item,
        ), patch(
            "app.api.routes.review_actions._latest_annotation",
            return_value=annotation,
        ), patch(
            "app.api.routes.review_actions.resolve_for_task",
            return_value=SimpleNamespace(
                review_required_approvals=2,
                review_dual_sign_off=True,
                review_mode="dual_signoff",
            ),
        ), patch(
            "app.api.routes.review_actions.assert_can_add_approval",
            return_value=None,
        ), patch(
            "app.api.routes.review_actions.dual_signoff_accept_outcome_after_review",
            return_value=("approved", "canonicalized", 2, 2),
        ), patch(
            "app.api.routes.review_actions.TaskHistoryRecorder.record",
            return_value=None,
        ), patch(
            "app.api.routes.review_actions.uuid.uuid4",
            return_value="review-uuid",
        ), patch(
            "app.api.routes.review_actions.ReviewDB",
            return_value=review_row,
        ):
            response = submit_task_item_review_action(
                "task_1",
                "item_1",
                payload=SimpleNamespace(
                    action="accept",
                    comment="final approval",
                    final_payload=None,
                    final_verdict=None,
                ),
                current_user=self.current_user,
                db=self.db,
            )

        self.assertEqual(response.next_ui_status, "approved")
        self.assertEqual(response.review_mode, "dual_signoff")
        self.assertEqual(item.status, "canonicalized")
        self.db.add.assert_called_once()
        self.db.commit.assert_called_once()
        self.assertEqual(review_row.review_status, "approved")


class EscalationDecisionStatusTests(unittest.TestCase):
    def test_send_back_maps_to_expert_send_back(self) -> None:
        self.assertEqual(
            _map_escalation_decision_to_task_item_status("send_back"),
            "expert_send_back",
        )

    def test_finalize_maps_to_canonicalized(self) -> None:
        self.assertEqual(
            _map_escalation_decision_to_task_item_status("finalize"),
            "canonicalized",
        )

    def test_adjust_is_no_longer_supported(self) -> None:
        with self.assertRaises(HTTPException) as exc:
            _map_escalation_decision_to_task_item_status("adjust")
        self.assertEqual(exc.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
