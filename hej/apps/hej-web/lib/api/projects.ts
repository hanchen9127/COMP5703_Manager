/**
 * Projects API module.
 *
 * Wraps backend endpoints:
 *   GET /organizations/{org_id}/projects   (list by org)
 *   GET /projects/{project_id}             (single project)
 *
 * Note: backend has no top-level `GET /projects`, so `listProjects` takes
 * an `orgId`. Listing across orgs is the caller's responsibility (do
 * `listOrganizations()` first and iterate).
 */
import { apiClient, type ApiResult } from "./client"

export type ApiProject = {
  id: string
  organization_id: string
  name: string
  description: string | null
  governance_model: string
  status: string
  created_at: string
  created_by: string | null
  updated_at: string | null
  updated_by: string | null
}

export type CreateProjectInput = {
  name: string
  description: string | null
  governance_model: string
}

export function listProjects(orgId: string): Promise<ApiResult<ApiProject[]>> {
  return apiClient.get<ApiProject[]>(`/organizations/${orgId}/projects`)
}

export function getProject(projectId: string): Promise<ApiResult<ApiProject>> {
  return apiClient.get<ApiProject>(`/projects/${projectId}`)
}

export function createProject(
  orgId: string,
  payload: CreateProjectInput
): Promise<ApiResult<ApiProject>> {
  return apiClient.post<ApiProject>(`/organizations/${orgId}/projects`, payload)
}
