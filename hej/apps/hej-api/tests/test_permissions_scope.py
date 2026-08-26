"""Tests for core permission and scope helpers."""

from __future__ import annotations

import unittest
from datetime import datetime, timezone
from types import SimpleNamespace

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.permissions import (
    verify_user_is_active,
    verify_user_org_access,
    verify_user_project_access,
)
from app.core.resource_scope import verify_user_task_item_access
from app.models.db_models import (
    Base,
    DataPointerDB,
    OrganizationDB,
    OrganizationUserDB,
    ProjectDB,
    TaskDB,
    TaskItemDB,
)


class PermissionsScopeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db = self.SessionLocal()
        self.db.add(OrganizationDB(id=10, name="Org 10", slug="org-10"))
        self.db.add(
            OrganizationUserDB(
                id=1,
                user_id=1,
                organization_id=10,
                status="active",
                removed_at=None,
            )
        )
        self.db.commit()
        self.current_user = {
            "user_id": 1,
            "email": "user@example.com",
            "org_contexts": [{"organization_id": 10, "roles": ["annotator"]}],
        }

    def tearDown(self) -> None:
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_verify_user_is_active_requires_user_id(self) -> None:
        with self.assertRaises(HTTPException) as exc:
            verify_user_is_active({"email": "user@example.com", "org_contexts": []})

        self.assertEqual(exc.exception.status_code, 401)

    def test_verify_user_is_active_accepts_valid_user_id(self) -> None:
        self.assertTrue(verify_user_is_active(self.current_user))

    def test_verify_user_org_access_allows_active_db_membership(self) -> None:
        self.assertTrue(verify_user_org_access(self.current_user, 10, self.db))

    def test_verify_user_org_access_allows_restricted_db_membership(self) -> None:
        membership = self.db.query(OrganizationUserDB).filter(OrganizationUserDB.id == 1).first()
        membership.status = "restricted"
        membership.removed_at = None
        self.db.commit()
        self.assertTrue(verify_user_org_access(self.current_user, 10, self.db))

    def test_verify_user_org_access_rejects_removed_db_membership(self) -> None:
        membership = self.db.query(OrganizationUserDB).filter(OrganizationUserDB.id == 1).first()
        membership.status = "removed"
        membership.removed_at = datetime.now(timezone.utc)
        self.db.commit()
        with self.assertRaises(HTTPException) as exc:
            verify_user_org_access(self.current_user, 10, self.db)
        self.assertEqual(exc.exception.status_code, 403)

    def test_verify_user_org_access_rejects_inactive_db_membership(self) -> None:
        membership = self.db.query(OrganizationUserDB).filter(OrganizationUserDB.id == 1).first()
        membership.status = "invited"
        membership.removed_at = None
        self.db.commit()
        with self.assertRaises(HTTPException) as exc:
            verify_user_org_access(self.current_user, 10, self.db)
        self.assertEqual(exc.exception.status_code, 403)

    def test_verify_user_org_access_without_db_preserves_token_only_behavior(self) -> None:
        self.assertTrue(verify_user_org_access(self.current_user, 10))

    def test_verify_user_org_access_rejects_non_member_org(self) -> None:
        with self.assertRaises(HTTPException) as exc:
            verify_user_org_access(self.current_user, 99)

        self.assertEqual(exc.exception.status_code, 403)

    def test_verify_user_project_access_allows_matching_org(self) -> None:
        project = SimpleNamespace(organization_id=10)
        self.assertTrue(verify_user_project_access(self.current_user, project, self.db))

    def test_verify_user_project_access_rejects_non_member_org(self) -> None:
        project = SimpleNamespace(organization_id=99)
        with self.assertRaises(HTTPException) as exc:
            verify_user_project_access(self.current_user, project, self.db)

        self.assertEqual(exc.exception.status_code, 403)

    def test_verify_user_project_access_requires_project_or_db(self) -> None:
        with self.assertRaises(HTTPException) as exc:
            verify_user_project_access(self.current_user, None, db=None)

        self.assertEqual(exc.exception.status_code, 400)

    def test_verify_user_task_item_access_allows_valid_scope(self) -> None:
        project = ProjectDB(id="proj_1", organization_id="10", name="Project 1")
        task = TaskDB(
            id="task_1",
            project_id="proj_1",
            title="Task 1",
            description="",
            judgment_question="Judge this",
            task_type="text",
            annotation_mode="human_first",
            label_schema_ref="schema_1",
        )
        pointer = DataPointerDB(
            id="ptr_1",
            task_id="task_1",
            location_ref="mock://item",
        )
        item = TaskItemDB(
            id="item_1",
            task_id="task_1",
            data_pointer_id="ptr_1",
            external_item_ref="ext-1",
        )
        self.db.add_all([project, task, pointer, item])
        self.db.commit()

        resolved = verify_user_task_item_access(self.current_user, "item_1", self.db)
        self.assertEqual(resolved.id, "item_1")


if __name__ == "__main__":
    unittest.main()
