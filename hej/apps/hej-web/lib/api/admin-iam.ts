/**
 * Admin IAM API module.
 *
 * Wraps backend endpoints under `/admin`.
 */
import { apiClient, type ApiResult } from "./client"

export type AdminOrgMember = {
  user_id: number
  email: string
  name?: string | null
  account_status: string
  organization_id: number
  membership_status: string
  roles: string[]
  joined_at?: string | null
  removed_at?: string | null
}

export type AdminMemberRolesUpdateRequest = {
  roles: string[]
}

export type AdminMemberRolesResponse = {
  user_id: number
  organization_id: number
  roles: string[]
}

export type AdminUserAccountStatus = "active" | "suspended" | "restricted"

export type AdminCreateUserRequest = {
  email: string
  password: string
  name?: string | null
  organization_id: number
  roles?: string[]
}

export type AdminCreateUserResponse = {
  id: number
  email: string
  name?: string | null
  account_status: string
  organization_id: number
  roles: string[]
}

export type AdminUserStatusUpdateRequest = {
  organization_id: number
  account_status: AdminUserAccountStatus
}

export type AdminUserStatusUpdateResponse = {
  id: number
  email: string
  name?: string | null
  account_status: AdminUserAccountStatus | string
}

export type AdminRemoveOrgMemberResponse = {
  user_id: number
  organization_id: number
  membership_status?: string
  removed_at?: string | null
}

export function listOrgMembersForAdmin(
  organizationId: string | number,
  includeRemoved = false,
): Promise<ApiResult<AdminOrgMember[]>> {
  const params = new URLSearchParams()
  if (includeRemoved) {
    params.set("include_removed", "true")
  }
  const query = params.toString()
  const suffix = query.length > 0 ? `?${query}` : ""
  return apiClient.get<AdminOrgMember[]>(`/admin/organizations/${organizationId}/members${suffix}`)
}

export function updateAdminMemberRoles(
  organizationId: string | number,
  userId: string | number,
  roles: string[],
): Promise<ApiResult<AdminMemberRolesResponse>> {
  return apiClient.patch<AdminMemberRolesResponse>(
    `/admin/organizations/${organizationId}/members/${userId}/roles`,
    { roles } satisfies AdminMemberRolesUpdateRequest,
  )
}

export function createAdminUser(payload: AdminCreateUserRequest): Promise<ApiResult<AdminCreateUserResponse>> {
  return apiClient.post<AdminCreateUserResponse>("/admin/users", payload)
}

export function updateAdminUserStatus(
  userId: string | number,
  status: AdminUserAccountStatus,
  organizationId: string | number,
): Promise<ApiResult<AdminUserStatusUpdateResponse>> {
  return apiClient.patch<AdminUserStatusUpdateResponse>(`/admin/users/${userId}/status`, {
    organization_id: Number(organizationId),
    account_status: status,
  } satisfies AdminUserStatusUpdateRequest)
}

export function removeAdminOrgMember(
  organizationId: string | number,
  userId: string | number,
): Promise<ApiResult<AdminRemoveOrgMemberResponse>> {
  return apiClient.delete<AdminRemoveOrgMemberResponse>(
    `/admin/organizations/${organizationId}/members/${userId}`,
  )
}
