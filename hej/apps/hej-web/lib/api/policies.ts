/**
 * Policy bundles catalog and project-level resolved policy aggregate.
 */
import { apiClient, type ApiResult } from "./client"
import type { ApiOrganizationPolicy } from "./organizations"
import type { ApiProject } from "./projects"
import type { ApiTask } from "./tasks"

export type ApiPolicyBundle = {
  id: string
  kind: "label_schema" | "review" | "dispute" | "export"
  title: string
  description: string
  rules: Record<string, unknown>
}

export type ApiResolvedPolicy = {
  label_schema_ref: string
  review_policy_ref: string
  review_mode: "dual_signoff" | "single_pass"
  review_required_approvals: number
  review_dual_sign_off: boolean
  dispute_policy_ref: string | null
  dispute_escalation_gate: string
  dispute_escalation_threshold: number
  dispute_inherited_from_org: boolean
  export_policy_ref: string | null
  export_provenance_required: boolean
  export_retention_days: number
  export_inherited_from_org: boolean
  annotation_mode: string
  rules_summary: string[]
}

export type ApiTaskPolicyEntry = {
  task: ApiTask
  resolved_policy: ApiResolvedPolicy
}

export type ApiProjectPolicies = {
  project: ApiProject
  organization_id: string
  organization_policy: ApiOrganizationPolicy | null
  tasks: ApiTaskPolicyEntry[]
  catalog: ApiPolicyBundle[]
}

export function listPolicyBundles(
  kind?: ApiPolicyBundle["kind"],
): Promise<ApiResult<ApiPolicyBundle[]>> {
  const query = kind ? `?kind=${encodeURIComponent(kind)}` : ""
  return apiClient.get<ApiPolicyBundle[]>(`/policy-bundles${query}`)
}

export function getProjectPolicies(
  projectId: string,
): Promise<ApiResult<ApiProjectPolicies>> {
  return apiClient.get<ApiProjectPolicies>(`/projects/${projectId}/policies`)
}

export function getTaskResolvedPolicy(
  taskId: string,
): Promise<ApiResult<ApiResolvedPolicy>> {
  return apiClient.get<ApiResolvedPolicy>(`/tasks/${taskId}/resolved-policy`)
}

export function resolvedPoliciesByTaskId(
  payload: ApiProjectPolicies,
): Record<string, ApiResolvedPolicy> {
  const map: Record<string, ApiResolvedPolicy> = {}
  for (const entry of payload.tasks) {
    const id = entry.task?.id
    if (id != null) {
      map[String(id)] = entry.resolved_policy
    }
  }
  return map
}
