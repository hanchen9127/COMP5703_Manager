import type {
  ApiOrganizationPolicy,
  PatchOrganizationPolicyInput,
} from "@/lib/api/organizations"

import type { ApiAnnotationMode } from "@/lib/api/tasks"
import type { MockTask } from "@/lib/domain/task-types"

export const DISPUTE_ESCALATION_GATES = ["none", "required", "mandatory"] as const
export type DisputeEscalationGate = (typeof DISPUTE_ESCALATION_GATES)[number]

export const ORG_ANNOTATION_MODES = ["ai_assisted", "human_first"] as const

export function formatDisputeEscalationGate(gate: string): string {
  switch (gate) {
    case "none":
      return "None — escalate only when reviewers choose"
    case "required":
      return "Required — threshold triggers escalation"
    case "mandatory":
      return "Mandatory — all disagreements escalate"
    default:
      return gate
  }
}

export function formatBooleanPolicy(value: boolean, whenTrue: string, whenFalse: string): string {
  return value ? whenTrue : whenFalse
}

export function organizationPolicySummaryRows(
  policy: ApiOrganizationPolicy,
): Array<{ label: string; value: string }> {
  return [
    {
      label: "Membership",
      value: formatBooleanPolicy(
        policy.membership_approval_required,
        "New members require approval",
        "Open membership",
      ),
    },
    {
      label: "Review",
      value: formatBooleanPolicy(
        policy.review_dual_sign_off,
        "Dual sign-off required",
        "Single reviewer sufficient",
      ),
    },
    {
      label: "Review escalation",
      value: formatBooleanPolicy(
        policy.review_auto_escalate_disagreement,
        "Auto-escalate reviewer disagreement",
        "Manual escalation only",
      ),
    },
    {
      label: "Dispute routing",
      value: formatDisputeEscalationGate(policy.dispute_escalation_gate),
    },
    {
      label: "Dispute threshold",
      value: `${policy.dispute_escalation_threshold}%`,
    },
    {
      label: "Export",
      value: formatBooleanPolicy(
        policy.export_provenance_required,
        "Provenance required on export",
        "Export without provenance gate",
      ),
    },
    {
      label: "Export retention",
      value: `${policy.export_retention_days} days`,
    },
    {
      label: "Default annotation mode",
      value: policy.annotation_mode === "ai_assisted" ? "AI-assisted" : "Human-first",
    },
  ]
}

export function taskPolicyRefsEditable(task: MockTask): boolean {
  return task.status === "draft" || task.status === "active"
}

export function taskUsesOrgDisputeDefault(task: MockTask): boolean {
  return !task.disputePolicyRef || task.disputePolicyRef.trim() === ""
}

export function taskUsesOrgExportDefault(task: MockTask): boolean {
  return !task.exportPolicyRef || task.exportPolicyRef.trim() === ""
}

export function displayPolicyRef(value: string | null | undefined, inheritedLabel: string): string {
  if (value && value.trim() !== "") {
    return value
  }
  return inheritedLabel
}

export function organizationPolicyFormFromApi(
  policy: ApiOrganizationPolicy,
): PatchOrganizationPolicyInput {
  return {
    membership_approval_required: policy.membership_approval_required,
    review_dual_sign_off: policy.review_dual_sign_off,
    review_auto_escalate_disagreement: policy.review_auto_escalate_disagreement,
    dispute_escalation_gate: policy.dispute_escalation_gate,
    dispute_escalation_threshold: policy.dispute_escalation_threshold,
    export_provenance_required: policy.export_provenance_required,
    export_retention_days: policy.export_retention_days,
    annotation_mode: policy.annotation_mode,
  }
}

export function organizationPolicyFormsEqual(
  a: PatchOrganizationPolicyInput,
  b: PatchOrganizationPolicyInput,
): boolean {
  return (
    Boolean(a.membership_approval_required) === Boolean(b.membership_approval_required) &&
    Boolean(a.review_dual_sign_off) === Boolean(b.review_dual_sign_off) &&
    Boolean(a.review_auto_escalate_disagreement) ===
      Boolean(b.review_auto_escalate_disagreement) &&
    (a.dispute_escalation_gate ?? "none") === (b.dispute_escalation_gate ?? "none") &&
    Number(a.dispute_escalation_threshold ?? 0) === Number(b.dispute_escalation_threshold ?? 0) &&
    Boolean(a.export_provenance_required) === Boolean(b.export_provenance_required) &&
    Number(a.export_retention_days ?? 0) === Number(b.export_retention_days ?? 0) &&
    (a.annotation_mode ?? "human_first") === (b.annotation_mode ?? "human_first")
  )
}

export type TaskPolicyFormSnapshot = {
  label_schema_ref: string
  review_policy_ref: string
  dispute_policy_ref: string | null
  export_policy_ref: string | null
  annotation_mode: ApiAnnotationMode
}

export function taskPolicyFormFromTask(task: MockTask): TaskPolicyFormSnapshot {
  return {
    label_schema_ref: task.outputSchemaRef.trim(),
    review_policy_ref: task.reviewPolicyRef.trim(),
    dispute_policy_ref: task.disputePolicyRef?.trim() || null,
    export_policy_ref: task.exportPolicyRef?.trim() || null,
    annotation_mode: task.executionMode,
  }
}

export function taskPolicyFormFromInputs(input: {
  label_schema_ref: string
  review_policy_ref: string
  dispute_policy_ref: string
  export_policy_ref: string
  annotation_mode: ApiAnnotationMode
}): TaskPolicyFormSnapshot {
  return {
    label_schema_ref: input.label_schema_ref.trim(),
    review_policy_ref: input.review_policy_ref.trim(),
    dispute_policy_ref: input.dispute_policy_ref.trim() || null,
    export_policy_ref: input.export_policy_ref.trim() || null,
    annotation_mode: input.annotation_mode,
  }
}

const POLICY_REF_ID_PATTERN = /^[a-z][a-z0-9_]{2,254}$/

export function validatePolicyRefId(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return `${fieldLabel} is required.`
  }
  if (!POLICY_REF_ID_PATTERN.test(trimmed)) {
    return `${fieldLabel} must use lowercase letters, numbers, and underscores.`
  }
  return null
}

export function validateOptionalPolicyRefId(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (!POLICY_REF_ID_PATTERN.test(trimmed)) {
    return `${fieldLabel} must use lowercase letters, numbers, and underscores.`
  }
  return null
}

export function taskPolicyFormsEqual(a: TaskPolicyFormSnapshot, b: TaskPolicyFormSnapshot): boolean {
  return (
    a.label_schema_ref === b.label_schema_ref &&
    a.review_policy_ref === b.review_policy_ref &&
    a.dispute_policy_ref === b.dispute_policy_ref &&
    a.export_policy_ref === b.export_policy_ref &&
    a.annotation_mode === b.annotation_mode
  )
}
