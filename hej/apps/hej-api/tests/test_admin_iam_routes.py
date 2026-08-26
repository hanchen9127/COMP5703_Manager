"""Tests for Admin IAM routes."""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

from app.api.routes.admin_iam import (
    create_user,
    list_members,
    remove_member,
    update_member_roles,
    update_user_status,
)
from app.schemas.admin_iam import (
    AdminMemberRolesUpdateRequest,
    AdminOrgMemberRead,
    AdminUserCreateRequest,
    AdminUserStatusUpdateRequest,
)


class AdminIamRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.current_user = {
            "user_id": 1,
            "email": "admin@example.com",
            "org_contexts": [{"organization_id": 10, "roles": ["admin"]}],
        }
        self.db = SimpleNamespace()

    def test_create_user_route_calls_service(self) -> None:
        request = AdminUserCreateRequest(
            email="new@example.com",
            password="secret123",
            name="New User",
            organization_id=10,
            roles=["annotator"],
        )
        with patch(
            "app.api.routes.admin_iam.create_user_for_org",
            return_value={
                "id": 2,
                "email": "new@example.com",
                "name": "New User",
                "account_status": "active",
                "organization_id": 10,
                "roles": ["annotator"],
            },
        ) as mocked:
            response = create_user(request, current_user=self.current_user, db=self.db)

        self.assertEqual(response.email, "new@example.com")
        self.assertEqual(response.organization_id, 10)
        mocked.assert_called_once()

    def test_status_route_propagates_http_exception(self) -> None:
        request = AdminUserStatusUpdateRequest(
            organization_id=10,
            account_status="suspended",
        )
        with patch(
            "app.api.routes.admin_iam.set_user_account_status",
            side_effect=HTTPException(status_code=409, detail="conflict"),
        ):
            with self.assertRaises(HTTPException) as exc:
                update_user_status(2, request, current_user=self.current_user, db=self.db)

        self.assertEqual(exc.exception.status_code, 409)

    def test_status_route_calls_service_and_returns_response(self) -> None:
        request = AdminUserStatusUpdateRequest(
            organization_id=10,
            account_status="suspended",
        )
        with patch(
            "app.api.routes.admin_iam.set_user_account_status",
            return_value=SimpleNamespace(
                id=2,
                email="target@example.com",
                name="Target",
                account_status="suspended",
            ),
        ) as mocked:
            response = update_user_status(2, request, current_user=self.current_user, db=self.db)

        self.assertEqual(response.account_status, "suspended")
        mocked.assert_called_once()

    def test_roles_route_calls_service(self) -> None:
        request = AdminMemberRolesUpdateRequest(roles=["reviewer"])
        with patch(
            "app.api.routes.admin_iam.set_org_member_roles",
            return_value={"user_id": 2, "organization_id": 10, "roles": ["reviewer"]},
        ) as mocked:
            response = update_member_roles(10, 2, request, current_user=self.current_user, db=self.db)

        self.assertEqual(response.roles, ["reviewer"])
        mocked.assert_called_once()

    def test_remove_route_calls_service(self) -> None:
        with patch(
            "app.api.routes.admin_iam.remove_org_member",
            return_value={
                "id": 33,
                "user_id": 2,
                "organization_id": 10,
                "status": "removed",
                "removed_at": None,
                "removed_by": 1,
            },
        ) as mocked:
            response = remove_member(10, 2, current_user=self.current_user, db=self.db)

        self.assertEqual(response.status, "removed")
        mocked.assert_called_once()

    def test_list_members_route_calls_service_and_returns_response(self) -> None:
        with patch(
            "app.api.routes.admin_iam.list_org_members_for_admin",
            return_value=[
                {
                    "user_id": 2,
                    "email": "member@example.com",
                    "name": "Member",
                    "account_status": "active",
                    "organization_id": 10,
                    "membership_status": "active",
                    "roles": ["annotator"],
                    "joined_at": None,
                    "removed_at": None,
                }
            ],
        ) as mocked:
            response = list_members(10, include_removed=False, current_user=self.current_user, db=self.db)

        self.assertEqual(len(response), 1)
        self.assertEqual(response[0].email, "member@example.com")
        self.assertIsInstance(response[0], AdminOrgMemberRead)
        mocked.assert_called_once()

    def test_list_members_route_propagates_http_exception(self) -> None:
        with patch(
            "app.api.routes.admin_iam.list_org_members_for_admin",
            side_effect=HTTPException(status_code=403, detail="forbidden"),
        ):
            with self.assertRaises(HTTPException) as exc:
                list_members(10, include_removed=False, current_user=self.current_user, db=self.db)

        self.assertEqual(exc.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
