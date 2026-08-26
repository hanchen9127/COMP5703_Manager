"""Policy schema and migration contract tests."""

from __future__ import annotations

import unittest

from app.core.database import init_db, migrate_db_schema, engine
from app.core.policy_refs import validate_task_policy_refs
from app.models.admin import DisputeEscalationGate
from app.schemas.tasks import TaskCreate, TaskRead
from fastapi import HTTPException
from sqlalchemy import inspect


class PolicyContractTests(unittest.TestCase):
    def test_task_schema_includes_policy_refs(self) -> None:
        fields = set(TaskRead.model_fields.keys())
        self.assertIn("dispute_policy_ref", fields)
        self.assertIn("export_policy_ref", fields)

    def test_task_create_accepts_policy_refs(self) -> None:
        payload = TaskCreate(
            title="Policy test task",
            judgment_question="Test?",
            annotation_mode="human_first",
            label_schema_ref="schema_test_v1",
            review_policy_ref="review_dual_signoff_v1",
            dispute_policy_ref="dispute_policy_v1",
            export_policy_ref="export_policy_v1",
        )
        self.assertEqual(payload.dispute_policy_ref, "dispute_policy_v1")
        self.assertEqual(payload.export_policy_ref, "export_policy_v1")

    def test_task_type_accepts_audio(self) -> None:
        payload = TaskCreate(
            title="Audio task",
            judgment_question="Listen?",
            annotation_mode="human_first",
            label_schema_ref="schema_test_v1",
            task_type="audio",
        )
        self.assertEqual(payload.task_type, "audio")

    def test_dispute_gate_enum_values(self) -> None:
        self.assertEqual(
            {item.value for item in DisputeEscalationGate},
            {"none", "required", "mandatory"},
        )

    def test_validate_task_policy_refs_normalizes_optional(self) -> None:
        refs = validate_task_policy_refs(
            label_schema_ref="image_detection_schema_v1",
            review_policy_ref="review_dual_signoff_v1",
            dispute_policy_ref="  ",
            export_policy_ref=None,
        )
        self.assertEqual(refs["label_schema_ref"], "image_detection_schema_v1")
        self.assertIsNone(refs["dispute_policy_ref"])

    def test_validate_task_policy_refs_rejects_invalid_format(self) -> None:
        with self.assertRaises(HTTPException):
            validate_task_policy_refs(
                label_schema_ref="Bad Schema",
                review_policy_ref=None,
            )

    def test_sqlite_tasks_table_has_policy_columns(self) -> None:
        init_db()
        migrate_db_schema()
        columns = {column["name"] for column in inspect(engine).get_columns("tasks")}
        self.assertIn("dispute_policy_ref", columns)
        self.assertIn("export_policy_ref", columns)


if __name__ == "__main__":
    unittest.main()
