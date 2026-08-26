/**
 * Organizations API module.
 *
 * Wraps backend endpoints:
 *   GET   /organizations
 *   GET   /organizations/{org_id}
 *   PATCH /organizations/{org_id}/policy
 *
 * UI should call these helpers, not raw fetch. Field shape matches FastAPI
 * schemas (snake_case). Mapping to UI types is the caller's choice.
 */
import { apiClient, type ApiResult } from "./client"

export type ApiOrganization = {
  id: number
  name: string
  slug: string
  description: string | null
  status: string
  created_at: string
  members_count: number
  admin_count: number
}

/** Matches backend `PolicyRead`. */
export type ApiOrganizationPolicy = {
  id: number
  organization_id: number
  membership_approval_required: boolean
  review_dual_sign_off: boolean
  review_auto_escalate_disagreement: boolean
  dispute_escalation_gate: string
  dispute_escalation_threshold: number
  export_provenance_required: boolean
  export_retention_days: number
  annotation_mode: string
}

/** Matches backend `OrganizationDetailRead` / `AdminOrganizationDetailRead`. */
export type ApiOrganizationDetail = ApiOrganization & {
  member_count: number
  admin_count: number
  policy: ApiOrganizationPolicy
}

export type PatchOrganizationPolicyInput = {
  membership_approval_required?: boolean
  review_dual_sign_off?: boolean
  review_auto_escalate_disagreement?: boolean
  dispute_escalation_gate?: string
  dispute_escalation_threshold?: number
  export_provenance_required?: boolean
  export_retention_days?: number
  annotation_mode?: string
}

export type PatchOrganizationPolicyResponse = {
  organization_id: number
  updated_at: string
  policy: ApiOrganizationPolicy
  message: string
}

export function listOrganizations(): Promise<ApiResult<ApiOrganization[]>> {
  return apiClient.get<ApiOrganization[]>("/organizations")
}

/**
 * Organization detail including governance policy.
 * Wire: `GET /organizations/{org_id}` → `OrganizationDetailRead`.
 */
export function getOrganizationDetail(
  orgId: string | number,
): Promise<ApiResult<ApiOrganizationDetail>> {
  return apiClient.get<ApiOrganizationDetail>(`/organizations/${orgId}`)
}

/** @deprecated Prefer `getOrganizationDetail` when policy is required. */
export function getOrganization(
  orgId: string | number,
): Promise<ApiResult<ApiOrganizationDetail>> {
  return getOrganizationDetail(orgId)
}

export function patchOrganizationPolicy(
  orgId: string | number,
  body: PatchOrganizationPolicyInput,
): Promise<ApiResult<PatchOrganizationPolicyResponse>> {
  return apiClient.patch<PatchOrganizationPolicyResponse>(
    `/organizations/${orgId}/policy`,
    body,
  )
}
