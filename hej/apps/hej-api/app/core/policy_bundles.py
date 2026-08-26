"""Canonical policy bundle registry (single source of truth for refs)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

PolicyBundleKind = Literal["label_schema", "review", "dispute", "export"]


@dataclass(frozen=True)
class PolicyBundle:
    id: str
    kind: PolicyBundleKind
    title: str
    description: str
    rules: dict[str, Any]


POLICY_BUNDLES: tuple[PolicyBundle, ...] = (
    PolicyBundle(
        id="image_detection_schema_v1",
        kind="label_schema",
        title="Image detection schema v1",
        description="Bounding-box detection labels with class vocabulary.",
        rules={"modality": "image", "geometry": "bbox"},
    ),
    PolicyBundle(
        id="sentiment_classification_schema_v1",
        kind="label_schema",
        title="Sentiment classification schema v1",
        description="Text sentiment labels (positive / neutral / negative).",
        rules={"modality": "text", "labels": ["positive", "neutral", "negative"]},
    ),
    PolicyBundle(
        id="review_dual_signoff_v1",
        kind="review",
        title="Dual sign-off review",
        description="Two distinct reviewers must approve before an item is fully reviewed.",
        rules={"required_approvals": 2, "distinct_reviewers": True},
    ),
    PolicyBundle(
        id="review_single_pass_v1",
        kind="review",
        title="Single-pass review",
        description="One reviewer approval completes review for the item.",
        rules={"required_approvals": 1, "distinct_reviewers": False},
    ),
    PolicyBundle(
        id="dispute_escalation_policy_v1",
        kind="dispute",
        title="Dispute escalation policy v1",
        description="Task-level dispute bundle; pairs with organization escalation gate defaults.",
        rules={"supports_manual_escalation": True},
    ),
    PolicyBundle(
        id="export_authoritative_with_provenance_v1",
        kind="export",
        title="Authoritative export with provenance",
        description="Exports must include provenance metadata and reviewed or canonicalized items.",
        rules={"provenance_required": True, "require_reviewed_items": True},
    ),
)

_BUNDLE_BY_ID = {bundle.id: bundle for bundle in POLICY_BUNDLES}


def get_bundle(bundle_id: str) -> PolicyBundle | None:
    return _BUNDLE_BY_ID.get(bundle_id)


def list_bundles(*, kind: PolicyBundleKind | None = None) -> list[PolicyBundle]:
    if kind is None:
        return list(POLICY_BUNDLES)
    return [bundle for bundle in POLICY_BUNDLES if bundle.kind == kind]


def known_bundle_ids(*, kind: PolicyBundleKind | None = None) -> frozenset[str]:
    return frozenset(bundle.id for bundle in list_bundles(kind=kind))
