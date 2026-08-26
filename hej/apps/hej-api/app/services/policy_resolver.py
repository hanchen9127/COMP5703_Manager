"""Merge organization defaults with task-level policy refs into executable rules."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from app.core.policy_bundles import get_bundle
from app.models import Task
from app.models.admin import DisputeEscalationGate, OrganizationPolicy

ReviewMode = Literal["dual_signoff", "single_pass"]

REVIEW_DUAL_REF = "review_dual_signoff_v1"
REVIEW_SINGLE_REF = "review_single_pass_v1"
DISPUTE_DEFAULT_REF = "dispute_escalation_policy_v1"
EXPORT_PROVENANCE_REF = "export_authoritative_with_provenance_v1"


@dataclass(frozen=True)
class ResolvedPolicy:
    label_schema_ref: str
    review_policy_ref: str
    review_mode: ReviewMode
    review_required_approvals: int
    review_dual_sign_off: bool
    dispute_policy_ref: str | None
    dispute_escalation_gate: str
    dispute_escalation_threshold: int
    dispute_inherited_from_org: bool
    export_policy_ref: str | None
    export_provenance_required: bool
    export_retention_days: int
    export_inherited_from_org: bool
    annotation_mode: str
    rules_summary: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "label_schema_ref": self.label_schema_ref,
            "review_policy_ref": self.review_policy_ref,
            "review_mode": self.review_mode,
            "review_required_approvals": self.review_required_approvals,
            "review_dual_sign_off": self.review_dual_sign_off,
            "dispute_policy_ref": self.dispute_policy_ref,
            "dispute_escalation_gate": self.dispute_escalation_gate,
            "dispute_escalation_threshold": self.dispute_escalation_threshold,
            "dispute_inherited_from_org": self.dispute_inherited_from_org,
            "export_policy_ref": self.export_policy_ref,
            "export_provenance_required": self.export_provenance_required,
            "export_retention_days": self.export_retention_days,
            "export_inherited_from_org": self.export_inherited_from_org,
            "annotation_mode": self.annotation_mode,
            "rules_summary": list(self.rules_summary),
        }


class PolicyResolver:
    @staticmethod
    def resolve_task_policy(
        task: Task,
        organization_policy: OrganizationPolicy | None,
    ) -> ResolvedPolicy:
        org = organization_policy
        org_dual = bool(org.review_dual_sign_off) if org else False
        org_gate = (
            org.dispute_escalation_gate.value
            if org and hasattr(org.dispute_escalation_gate, "value")
            else (
                str(org.dispute_escalation_gate)
                if org
                else DisputeEscalationGate.NONE.value
            )
        )
        org_threshold = org.dispute_escalation_threshold if org else 100
        org_export_prov = bool(org.export_provenance_required) if org else True
        org_retention = org.export_retention_days if org else 365
        org_annotation = org.annotation_mode if org else "human_first"

        review_ref = (task.review_policy_ref or "").strip()
        if not review_ref:
            review_ref = REVIEW_DUAL_REF if org_dual else REVIEW_SINGLE_REF

        review_mode: ReviewMode = (
            "dual_signoff" if review_ref == REVIEW_DUAL_REF else "single_pass"
        )
        required_approvals = 2 if review_mode == "dual_signoff" else 1

        dispute_ref = _normalize_optional_ref(task.dispute_policy_ref)
        dispute_inherited = dispute_ref is None
        if dispute_inherited:
            dispute_ref = None
            dispute_gate = org_gate
            dispute_threshold = org_threshold
        else:
            dispute_gate = org_gate
            dispute_threshold = org_threshold
            bundle = get_bundle(dispute_ref)
            if bundle and dispute_ref == DISPUTE_DEFAULT_REF:
                dispute_gate = org_gate

        export_ref = _normalize_optional_ref(task.export_policy_ref)
        export_inherited = export_ref is None
        if export_inherited:
            export_ref = None
            export_provenance = org_export_prov
            export_retention = org_retention
        else:
            bundle = get_bundle(export_ref)
            export_provenance = bool(
                bundle and bundle.rules.get("provenance_required")
            ) or org_export_prov
            export_retention = org_retention

        rules_summary = _build_rules_summary(
            review_mode=review_mode,
            required_approvals=required_approvals,
            dispute_gate=dispute_gate,
            dispute_inherited=dispute_inherited,
            export_provenance=export_provenance,
            export_inherited=export_inherited,
        )

        return ResolvedPolicy(
            label_schema_ref=task.label_schema_ref,
            review_policy_ref=review_ref,
            review_mode=review_mode,
            review_required_approvals=required_approvals,
            review_dual_sign_off=review_mode == "dual_signoff",
            dispute_policy_ref=dispute_ref,
            dispute_escalation_gate=dispute_gate,
            dispute_escalation_threshold=dispute_threshold,
            dispute_inherited_from_org=dispute_inherited,
            export_policy_ref=export_ref,
            export_provenance_required=export_provenance,
            export_retention_days=export_retention,
            export_inherited_from_org=export_inherited,
            annotation_mode=str(task.annotation_mode.value)
            if hasattr(task.annotation_mode, "value")
            else str(task.annotation_mode),
            rules_summary=rules_summary,
        )


def _normalize_optional_ref(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed if trimmed else None


def _build_rules_summary(
    *,
    review_mode: ReviewMode,
    required_approvals: int,
    dispute_gate: str,
    dispute_inherited: bool,
    export_provenance: bool,
    export_inherited: bool,
) -> tuple[str, ...]:
    lines: list[str] = []
    if review_mode == "dual_signoff":
        lines.append(f"Review requires {required_approvals} distinct approvals.")
    else:
        lines.append("Review completes after one approval.")
    if dispute_inherited:
        lines.append(f"Dispute escalation gate (org): {dispute_gate}.")
    else:
        lines.append(f"Dispute bundle active; gate follows org ({dispute_gate}).")
    if export_inherited:
        lines.append(
            "Export provenance required (org)."
            if export_provenance
            else "Export without provenance gate (org)."
        )
    else:
        lines.append(
            "Export bundle requires provenance metadata."
            if export_provenance
            else "Export bundle active without provenance gate."
        )
    return tuple(lines)
