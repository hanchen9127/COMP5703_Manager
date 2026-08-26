"""Policy bundle registry and resolver unit tests."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime

from app.core.policy_bundles import get_bundle, list_bundles
from app.models import AnnotationMode, Task, TaskStatus, TaskType
from app.models.admin import DisputeEscalationGate, OrganizationPolicy
from app.services.policy_resolver import PolicyResolver, REVIEW_DUAL_REF, REVIEW_SINGLE_REF


def _org_policy(**overrides) -> OrganizationPolicy:
    base = dict(
        id=1,
        organization_id=1,
        membership_approval_required=False,
        review_dual_sign_off=False,
        review_auto_escalate_disagreement=False,
        dispute_escalation_gate=DisputeEscalationGate.NONE,
        dispute_escalation_threshold=100,
        export_provenance_required=True,
        export_retention_days=365,
        annotation_mode="human_first",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        updated_by=1,
    )
    base.update(overrides)
    return OrganizationPolicy(**base)


def _task(**overrides) -> Task:
    base = dict(
        id="task_1",
        project_id="proj_1",
        title="T",
        judgment_question="Q?",
        task_type=TaskType.TEXT,
        annotation_mode=AnnotationMode.HUMAN_FIRST,
        label_schema_ref="image_detection_schema_v1",
        review_policy_ref=None,
        dispute_policy_ref=None,
        export_policy_ref=None,
        status=TaskStatus.DRAFT,
        created_at=datetime.now(UTC),
    )
    base.update(overrides)
    return Task(**base)


class PolicyResolverTests(unittest.TestCase):
    def test_bundle_registry_contains_review_dual(self) -> None:
        bundle = get_bundle(REVIEW_DUAL_REF)
        self.assertIsNotNone(bundle)
        self.assertEqual(bundle.rules.get("required_approvals"), 2)

    def test_list_bundles_filter_by_kind(self) -> None:
        review_bundles = list_bundles(kind="review")
        self.assertEqual({b.id for b in review_bundles}, {REVIEW_DUAL_REF, REVIEW_SINGLE_REF})

    def test_task_review_ref_overrides_org_dual_off(self) -> None:
        resolved = PolicyResolver.resolve_task_policy(
            _task(review_policy_ref=REVIEW_DUAL_REF),
            _org_policy(review_dual_sign_off=False),
        )
        self.assertEqual(resolved.review_mode, "dual_signoff")
        self.assertEqual(resolved.review_required_approvals, 2)

    def test_org_dual_sign_off_when_task_ref_empty(self) -> None:
        resolved = PolicyResolver.resolve_task_policy(
            _task(review_policy_ref=None),
            _org_policy(review_dual_sign_off=True),
        )
        self.assertEqual(resolved.review_policy_ref, REVIEW_DUAL_REF)
        self.assertTrue(resolved.review_dual_sign_off)

    def test_inherit_org_export_when_task_ref_empty(self) -> None:
        resolved = PolicyResolver.resolve_task_policy(
            _task(export_policy_ref=None),
            _org_policy(export_provenance_required=False),
        )
        self.assertIsNone(resolved.export_policy_ref)
        self.assertFalse(resolved.export_provenance_required)
        self.assertTrue(resolved.export_inherited_from_org)


if __name__ == "__main__":
    unittest.main()
