"""Tests for project export listing governance."""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

from app.api.routes.projects import _is_task_export_eligible, list_project_exports


class ProjectExportListingGovernanceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.current_user = {
            "user_id": 1,
            "email": "user@example.com",
            "org_contexts": [{"organization_id": 10, "roles": ["annotator"]}],
        }
        self.db = SimpleNamespace()

    def test_allows_eligible_exports_only(self) -> None:
        project = SimpleNamespace(organization_id="10")
        with patch("app.api.routes.projects.verify_user_is_active", return_value=1), patch(
            "app.api.routes.projects.ProjectService.get_project",
            return_value=project,
        ), patch(
            "app.api.routes.projects.verify_user_project_access",
            return_value=True,
        ), patch(
            "app.api.routes.projects.TaskService.list_tasks",
            return_value=[
                SimpleNamespace(id="task_completed", status="completed"),
                SimpleNamespace(id="task_ready", status="ready"),
                SimpleNamespace(id="task_draft", status="draft"),
            ],
        ), patch(
            "app.api.routes.projects.ProjectExportsService.list_project_exports",
            return_value=[
                SimpleNamespace(task_id="task_completed", status="ready"),
                SimpleNamespace(task_id="task_ready", status="building"),
                SimpleNamespace(task_id="task_draft", status="draft"),
            ],
        ):
            response = list_project_exports("proj_1", current_user=self.current_user, db=self.db)

        self.assertEqual([item.task_id for item in response], ["task_completed"])

    def test_propagates_project_access_denial(self) -> None:
        project = SimpleNamespace(organization_id="10")
        with patch("app.api.routes.projects.verify_user_is_active", return_value=1), patch(
            "app.api.routes.projects.ProjectService.get_project",
            return_value=project,
        ), patch(
            "app.api.routes.projects.verify_user_project_access",
            side_effect=HTTPException(status_code=403, detail="forbidden"),
        ):
            with self.assertRaises(HTTPException) as exc:
                list_project_exports("proj_1", current_user=self.current_user, db=self.db)

        self.assertEqual(exc.exception.status_code, 403)

    def test_excludes_ineligible_task_statuses(self) -> None:
        self.assertFalse(_is_task_export_eligible(SimpleNamespace(status="draft")))
        self.assertFalse(_is_task_export_eligible(SimpleNamespace(status="ready")))
        self.assertFalse(_is_task_export_eligible(SimpleNamespace(status="in_review")))
        self.assertFalse(_is_task_export_eligible(SimpleNamespace(status="disputed")))
        self.assertTrue(_is_task_export_eligible(SimpleNamespace(status="completed")))

    def test_matches_export_task_ids_as_strings(self) -> None:
        project = SimpleNamespace(organization_id="10")
        with patch("app.api.routes.projects.verify_user_is_active", return_value=1), patch(
            "app.api.routes.projects.ProjectService.get_project",
            return_value=project,
        ), patch(
            "app.api.routes.projects.verify_user_project_access",
            return_value=True,
        ), patch(
            "app.api.routes.projects.TaskService.list_tasks",
            return_value=[SimpleNamespace(id=101, status="completed")],
        ), patch(
            "app.api.routes.projects.ProjectExportsService.list_project_exports",
            return_value=[SimpleNamespace(task_id="101", status="ready")],
        ):
            response = list_project_exports("proj_1", current_user=self.current_user, db=self.db)

        self.assertEqual([item.task_id for item in response], ["101"])


if __name__ == "__main__":
    unittest.main()
