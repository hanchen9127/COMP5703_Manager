"""Tests for the Admin IAM service MVP."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException

from app.models.admin import AccountStatus, RoleScope, User
from app.models.db_models import OrganizationUserDB, RoleAssignmentDB, UserDB
from app.services.admin_iam_service import (
    create_user_for_org,
    list_org_members_for_admin,
    remove_org_member,
    set_org_member_roles,
    set_user_account_status,
)


class _QueryStub:
    def __init__(self, *, first_result=None, all_result=None):
        self.first_result = first_result
        self.all_result = all_result

    def filter(self, *args, **kwargs):
        return self

    def all(self):
        if self.all_result is not None:
            return self.all_result
        if self.first_result is not None:
            return [self.first_result]
        return []

    def first(self):
        return self.first_result


class AdminIamServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.db = MagicMock()
        self.actor = {
            "user_id": 1,
            "email": "admin@example.com",
            "org_contexts": [{"organization_id": 10, "roles": ["admin"]}],
        }
        self.non_admin = {
            "user_id": 2,
            "email": "user@example.com",
            "org_contexts": [{"organization_id": 10, "roles": ["annotator"]}],
        }
        self.cross_org_admin = {
            "user_id": 3,
            "email": "other@example.com",
            "org_contexts": [{"organization_id": 99, "roles": ["admin"]}],
        }
        self.organization = SimpleNamespace(id=10, name="Org 10", slug="org-10", status="active")
        self.db_store = SimpleNamespace(
            users=MagicMock(),
            organizations=MagicMock(),
            organization_users=MagicMock(),
            role_assignments=MagicMock(),
        )
        self.db_store.organizations.get.return_value = self.organization
        self.db_store.users.get_by_email.return_value = None
        self.db_store.users.get.return_value = User(
            id=11,
            email="target@example.com",
            password_hash="hash",
            name="Target",
            account_status=AccountStatus.ACTIVE,
            two_factor_enabled=False,
            last_login_at=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    def _patch_dbstore(self):
        return patch("app.services.admin_iam_service.DBStore", return_value=self.db_store)

    def _set_query_map(self, mapping):
        def query_side_effect(model):
            return mapping[model]

        self.db.query.side_effect = query_side_effect

    def test_org_admin_can_create_user_in_own_org(self) -> None:
        self.db_store.users.get_by_email.return_value = None
        self.db_store.organizations.get.return_value = self.organization

        user_row = UserDB(
            id=100,
            email="new@example.com",
            password_hash="hash",
            name="New User",
            account_status="active",
            two_factor_enabled=False,
        )
        membership_row = OrganizationUserDB(
            id=200,
            user_id=100,
            organization_id=10,
            status="active",
            invited_by=1,
            accepted_at=datetime.now(UTC),
        )
        query_map = {
            UserDB: _QueryStub(first_result=user_row),
            OrganizationUserDB: _QueryStub(first_result=membership_row),
            RoleAssignmentDB: _QueryStub(all_result=[]),
        }
        self._set_query_map(query_map)

        with self._patch_dbstore():
            result = create_user_for_org(
                self.actor,
                email="new@example.com",
                password="secret123",
                name="New User",
                organization_id=10,
                roles=["annotator", "reviewer"],
                db=self.db,
            )

        self.assertEqual(result["email"], "new@example.com")
        self.assertEqual(result["organization_id"], 10)
        self.assertEqual(result["roles"], ["annotator", "reviewer"])
        self.assertTrue(self.db.add.called)
        self.assertTrue(self.db.commit.called)

    def test_non_admin_cannot_create_user(self) -> None:
        with self._patch_dbstore():
            with self.assertRaises(HTTPException) as exc:
                create_user_for_org(
                    self.non_admin,
                    email="new@example.com",
                    password="secret123",
                    organization_id=10,
                    roles=["annotator"],
                    db=self.db,
                )

        self.assertEqual(exc.exception.status_code, 403)

    def test_cross_org_admin_cannot_create_user(self) -> None:
        with self._patch_dbstore():
            with self.assertRaises(HTTPException) as exc:
                create_user_for_org(
                    self.cross_org_admin,
                    email="new@example.com",
                    password="secret123",
                    organization_id=10,
                    roles=["annotator"],
                    db=self.db,
                )

        self.assertEqual(exc.exception.status_code, 403)

    def test_duplicate_email_rejected_with_409(self) -> None:
        self.db_store.users.get_by_email.return_value = SimpleNamespace(id=99)
        with self._patch_dbstore():
            with self.assertRaises(HTTPException) as exc:
                create_user_for_org(
                    self.actor,
                    email="dupe@example.com",
                    password="secret123",
                    organization_id=10,
                    roles=["annotator"],
                    db=self.db,
                )

        self.assertEqual(exc.exception.status_code, 409)

    def test_invalid_role_rejected_with_400(self) -> None:
        with self._patch_dbstore():
            with self.assertRaises(HTTPException) as exc:
                create_user_for_org(
                    self.actor,
                    email="new@example.com",
                    password="secret123",
                    organization_id=10,
                    roles=["invalid"],
                    db=self.db,
                )

        self.assertEqual(exc.exception.status_code, 400)

    def test_admin_can_suspend_another_user(self) -> None:
        user_row = UserDB(
            id=11,
            email="target@example.com",
            password_hash="hash",
            name="Target",
            account_status="active",
            two_factor_enabled=False,
        )
        query_map = {
            UserDB: _QueryStub(first_result=user_row),
            OrganizationUserDB: _QueryStub(first_result=OrganizationUserDB(
                id=22,
                user_id=11,
                organization_id=10,
                status="active",
                invited_by=1,
                accepted_at=datetime.now(UTC),
            )),
            RoleAssignmentDB: _QueryStub(all_result=[]),
        }
        self._set_query_map(query_map)
        self.db_store.users.get.return_value = User(
            id=11,
            email="target@example.com",
            password_hash="hash",
            name="Target",
            account_status=AccountStatus.ACTIVE,
            two_factor_enabled=False,
            last_login_at=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        with self._patch_dbstore():
            result = set_user_account_status(
                self.actor,
                user_id=11,
                organization_id=10,
                account_status="suspended",
                db=self.db,
            )

        self.assertEqual(user_row.account_status, "suspended")
        self.assertTrue(self.db.commit.called)
        self.assertEqual(result.id, 11)

    def test_cannot_suspend_self(self) -> None:
        self.db_store.users.get.return_value = User(
            id=1,
            email="admin@example.com",
            password_hash="hash",
            name="Admin",
            account_status=AccountStatus.ACTIVE,
            two_factor_enabled=False,
            last_login_at=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        query_map = {
            UserDB: _QueryStub(first_result=UserDB(
                id=1,
                email="admin@example.com",
                password_hash="hash",
                name="Admin",
                account_status="active",
                two_factor_enabled=False,
            )),
            OrganizationUserDB: _QueryStub(first_result=OrganizationUserDB(
                id=22,
                user_id=1,
                organization_id=10,
                status="active",
                invited_by=1,
                accepted_at=datetime.now(UTC),
            )),
            RoleAssignmentDB: _QueryStub(all_result=[]),
        }
        self._set_query_map(query_map)

        with self._patch_dbstore():
            with self.assertRaises(HTTPException) as exc:
                set_user_account_status(
                    self.actor,
                    user_id=1,
                    organization_id=10,
                    account_status="restricted",
                    db=self.db,
                )

        self.assertEqual(exc.exception.status_code, 409)

    def test_invalid_account_status_rejected(self) -> None:
        with self._patch_dbstore():
            with self.assertRaises(HTTPException) as exc:
                set_user_account_status(
                    self.actor,
                    user_id=11,
                    organization_id=10,
                    account_status="disabled",
                    db=self.db,
                )

        self.assertEqual(exc.exception.status_code, 400)

    def test_admin_can_replace_member_roles(self) -> None:
        self.db_store.users.get.return_value = User(
            id=11,
            email="target@example.com",
            password_hash="hash",
            name="Target",
            account_status=AccountStatus.ACTIVE,
            two_factor_enabled=False,
            last_login_at=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        membership = OrganizationUserDB(
            id=22,
            user_id=11,
            organization_id=10,
            status="active",
            invited_by=1,
            accepted_at=datetime.now(UTC),
        )
        current_role = RoleAssignmentDB(
            id=33,
            user_id=11,
            organization_id=10,
            project_id=None,
            role_key="annotator",
            role_name="annotator",
            scope="organization",
            granted_by=1,
            revoked_at=None,
        )
        query_map = {
            UserDB: _QueryStub(first_result=UserDB(
                id=11,
                email="target@example.com",
                password_hash="hash",
                name="Target",
                account_status="active",
                two_factor_enabled=False,
            )),
            OrganizationUserDB: _QueryStub(first_result=membership, all_result=[membership]),
            RoleAssignmentDB: _QueryStub(all_result=[current_role]),
        }
        self._set_query_map(query_map)

        with self._patch_dbstore():
            result = set_org_member_roles(
                self.actor,
                user_id=11,
                organization_id=10,
                roles=["reviewer"],
                db=self.db,
            )

        self.assertEqual(result["roles"], ["reviewer"])
        self.assertEqual(current_role.revoked_by, 1)
        self.assertEqual(current_role.change_reason, "roles_replaced")

    def test_cannot_remove_last_admin_role(self) -> None:
        self.db_store.users.get.return_value = User(
            id=11,
            email="target@example.com",
            password_hash="hash",
            name="Target",
            account_status=AccountStatus.ACTIVE,
            two_factor_enabled=False,
            last_login_at=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        membership = OrganizationUserDB(
            id=22,
            user_id=11,
            organization_id=10,
            status="active",
            invited_by=1,
            accepted_at=datetime.now(UTC),
        )
        current_role = RoleAssignmentDB(
            id=33,
            user_id=11,
            organization_id=10,
            project_id=None,
            role_key="admin",
            role_name="admin",
            scope="organization",
            granted_by=1,
            revoked_at=None,
        )
        query_map = {
            UserDB: _QueryStub(first_result=UserDB(
                id=11,
                email="target@example.com",
                password_hash="hash",
                name="Target",
                account_status="active",
                two_factor_enabled=False,
            )),
            OrganizationUserDB: _QueryStub(first_result=membership, all_result=[membership]),
            RoleAssignmentDB: _QueryStub(all_result=[current_role]),
        }
        self._set_query_map(query_map)

        with self._patch_dbstore():
            with self.assertRaises(HTTPException) as exc:
                set_org_member_roles(
                    self.actor,
                    user_id=11,
                    organization_id=10,
                    roles=["annotator"],
                    db=self.db,
                )

        self.assertEqual(exc.exception.status_code, 409)

    def test_admin_can_soft_remove_member(self) -> None:
        self.db_store.users.get.return_value = User(
            id=11,
            email="target@example.com",
            password_hash="hash",
            name="Target",
            account_status=AccountStatus.ACTIVE,
            two_factor_enabled=False,
            last_login_at=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        membership = OrganizationUserDB(
            id=22,
            user_id=11,
            organization_id=10,
            status="active",
            invited_by=1,
            accepted_at=datetime.now(UTC),
        )
        current_role = RoleAssignmentDB(
            id=33,
            user_id=11,
            organization_id=10,
            project_id=None,
            role_key="annotator",
            role_name="annotator",
            scope="organization",
            granted_by=1,
            revoked_at=None,
        )
        query_map = {
            UserDB: _QueryStub(first_result=UserDB(
                id=11,
                email="target@example.com",
                password_hash="hash",
                name="Target",
                account_status="active",
                two_factor_enabled=False,
            )),
            OrganizationUserDB: _QueryStub(first_result=membership, all_result=[membership]),
            RoleAssignmentDB: _QueryStub(all_result=[current_role]),
        }
        self._set_query_map(query_map)

        with self._patch_dbstore():
            result = remove_org_member(
                self.actor,
                user_id=11,
                organization_id=10,
                db=self.db,
            )

        self.assertEqual(result["status"], "removed")
        self.assertEqual(current_role.change_reason, "member_removed")

    def test_cannot_remove_last_admin_member(self) -> None:
        self.db_store.users.get.return_value = User(
            id=11,
            email="target@example.com",
            password_hash="hash",
            name="Target",
            account_status=AccountStatus.ACTIVE,
            two_factor_enabled=False,
            last_login_at=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        membership = OrganizationUserDB(
            id=22,
            user_id=11,
            organization_id=10,
            status="active",
            invited_by=1,
            accepted_at=datetime.now(UTC),
        )
        current_role = RoleAssignmentDB(
            id=33,
            user_id=11,
            organization_id=10,
            project_id=None,
            role_key="admin",
            role_name="admin",
            scope="organization",
            granted_by=1,
            revoked_at=None,
        )
        query_map = {
            UserDB: _QueryStub(first_result=UserDB(
                id=11,
                email="target@example.com",
                password_hash="hash",
                name="Target",
                account_status="active",
                two_factor_enabled=False,
            )),
            OrganizationUserDB: _QueryStub(first_result=membership, all_result=[membership]),
            RoleAssignmentDB: _QueryStub(all_result=[current_role]),
        }
        self._set_query_map(query_map)

        with self._patch_dbstore():
            with self.assertRaises(HTTPException) as exc:
                remove_org_member(
                    self.actor,
                    user_id=11,
                    organization_id=10,
                    db=self.db,
                )

        self.assertEqual(exc.exception.status_code, 409)

    def test_list_org_members_admin_can_list_active_members(self) -> None:
        active_membership = OrganizationUserDB(
            id=22,
            user_id=11,
            organization_id=10,
            status="active",
            invited_by=1,
            accepted_at=datetime(2025, 1, 1, tzinfo=UTC),
        )
        user_row = UserDB(
            id=11,
            email="target@example.com",
            password_hash="hash",
            name="Target",
            account_status="active",
            two_factor_enabled=False,
        )
        active_role = RoleAssignmentDB(
            id=33,
            user_id=11,
            organization_id=10,
            project_id=None,
            role_key="reviewer",
            role_name="reviewer",
            scope="organization",
            granted_by=1,
            revoked_at=None,
        )
        other_org_role = RoleAssignmentDB(
            id=34,
            user_id=11,
            organization_id=99,
            project_id=None,
            role_key="admin",
            role_name="admin",
            scope="organization",
            granted_by=1,
            revoked_at=None,
        )
        query_map = {
            OrganizationUserDB: _QueryStub(all_result=[active_membership]),
            UserDB: _QueryStub(all_result=[user_row]),
            RoleAssignmentDB: _QueryStub(all_result=[active_role, other_org_role]),
        }
        self._set_query_map(query_map)

        with self._patch_dbstore():
            result = list_org_members_for_admin(self.actor, 10, self.db)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["email"], "target@example.com")
        self.assertEqual(result[0]["roles"], ["reviewer"])

    def test_list_org_members_non_admin_rejected(self) -> None:
        with self._patch_dbstore():
            with self.assertRaises(HTTPException) as exc:
                list_org_members_for_admin(self.non_admin, 10, self.db)

        self.assertEqual(exc.exception.status_code, 403)

    def test_list_org_members_cross_org_admin_rejected(self) -> None:
        with self._patch_dbstore():
            with self.assertRaises(HTTPException) as exc:
                list_org_members_for_admin(self.cross_org_admin, 10, self.db)

        self.assertEqual(exc.exception.status_code, 403)

    def test_list_org_members_removed_hidden_by_default(self) -> None:
        removed_membership = OrganizationUserDB(
            id=23,
            user_id=12,
            organization_id=10,
            status="removed",
            invited_by=1,
            removed_at=datetime.now(UTC),
        )
        removed_user = UserDB(
            id=12,
            email="removed@example.com",
            password_hash="hash",
            name="Removed",
            account_status="restricted",
            two_factor_enabled=False,
        )
        query_map = {
            OrganizationUserDB: _QueryStub(all_result=[removed_membership]),
            UserDB: _QueryStub(all_result=[removed_user]),
            RoleAssignmentDB: _QueryStub(all_result=[]),
        }
        self._set_query_map(query_map)

        with self._patch_dbstore():
            result = list_org_members_for_admin(self.actor, 10, self.db)

        self.assertEqual(result, [])

    def test_list_org_members_include_removed_returns_removed_member(self) -> None:
        removed_membership = OrganizationUserDB(
            id=23,
            user_id=12,
            organization_id=10,
            status="removed",
            invited_by=1,
            removed_at=datetime.now(UTC),
        )
        removed_user = UserDB(
            id=12,
            email="removed@example.com",
            password_hash="hash",
            name="Removed",
            account_status="restricted",
            two_factor_enabled=False,
        )
        query_map = {
            OrganizationUserDB: _QueryStub(all_result=[removed_membership]),
            UserDB: _QueryStub(all_result=[removed_user]),
            RoleAssignmentDB: _QueryStub(all_result=[]),
        }
        self._set_query_map(query_map)

        with self._patch_dbstore():
            result = list_org_members_for_admin(self.actor, 10, self.db, include_removed=True)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["membership_status"], "removed")

    def test_list_org_members_only_org_scoped_active_roles(self) -> None:
        membership = OrganizationUserDB(
            id=22,
            user_id=11,
            organization_id=10,
            status="active",
            invited_by=1,
            accepted_at=datetime.now(UTC),
        )
        user_row = UserDB(
            id=11,
            email="target@example.com",
            password_hash="hash",
            name="Target",
            account_status="active",
            two_factor_enabled=False,
        )
        active_org_role = RoleAssignmentDB(
            id=33,
            user_id=11,
            organization_id=10,
            project_id=None,
            role_key="annotator",
            role_name="annotator",
            scope="organization",
            granted_by=1,
            revoked_at=None,
        )
        revoked_org_role = RoleAssignmentDB(
            id=34,
            user_id=11,
            organization_id=10,
            project_id=None,
            role_key="reviewer",
            role_name="reviewer",
            scope="organization",
            granted_by=1,
            revoked_at=datetime.now(UTC),
        )
        project_role = RoleAssignmentDB(
            id=35,
            user_id=11,
            organization_id=10,
            project_id=55,
            role_key="admin",
            role_name="admin",
            scope="project",
            granted_by=1,
            revoked_at=None,
        )
        query_map = {
            OrganizationUserDB: _QueryStub(all_result=[membership]),
            UserDB: _QueryStub(all_result=[user_row]),
            RoleAssignmentDB: _QueryStub(all_result=[active_org_role, revoked_org_role, project_role]),
        }
        self._set_query_map(query_map)

        with self._patch_dbstore():
            result = list_org_members_for_admin(self.actor, 10, self.db)

        self.assertEqual(result[0]["roles"], ["annotator"])


if __name__ == "__main__":
    unittest.main()
