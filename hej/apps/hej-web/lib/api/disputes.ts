/**
 * Project-level dispute case read API.
 */
import { apiClient, type ApiResult } from "./client"

export type ApiDisputeCase = {
  id: string
  task_id: string
  task_item_id: string
  status: string
  severity: string
  opened_by: string
  assigned_to: string
  disagreement_summary: string
  created_at: string
}

export function getProjectDisputes(
  projectId: string,
): Promise<ApiResult<ApiDisputeCase[]>> {
  return apiClient.get<ApiDisputeCase[]>(`/projects/${projectId}/disputes`)
}
