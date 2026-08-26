import type { ApiResolvedPolicy } from "@/lib/api/policies"

export function formatReviewModeLabel(policy: ApiResolvedPolicy): string {
  return policy.review_mode === "dual_signoff"
    ? `Dual sign-off (${policy.review_required_approvals} approvals)`
    : "Single-pass review"
}

export function formatDisputeGateLabel(policy: ApiResolvedPolicy): string {
  const gate = policy.dispute_escalation_gate
  const suffix = policy.dispute_inherited_from_org ? " (org default)" : " (task bundle)"
  return `Escalation gate: ${gate}${suffix}`
}

export function formatExportPolicyLabel(policy: ApiResolvedPolicy): string {
  if (policy.export_inherited_from_org) {
    return policy.export_provenance_required
      ? "Export: provenance required (org)"
      : "Export: no provenance gate (org)"
  }
  return policy.export_provenance_required
    ? `Export bundle: ${policy.export_policy_ref ?? "provenance"}`
    : `Export bundle: ${policy.export_policy_ref ?? "custom"}`
}

export function resolvedPolicyHeadline(policy: ApiResolvedPolicy): string {
  return [
    formatReviewModeLabel(policy),
    formatDisputeGateLabel(policy),
    formatExportPolicyLabel(policy),
  ].join(" · ")
}
