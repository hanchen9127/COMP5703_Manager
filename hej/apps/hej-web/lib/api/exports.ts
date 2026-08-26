/**
 * Project-level export package read API.
 */
import { apiClient, type ApiResult } from "./client"

export type ApiExportPackage = {
  id: string
  project_id: string
  task_id: string
  status: string
  format: string
  item_count: number
  completed_item_count: number
  includes_provenance: boolean
  destination: string
  created_at: string
  export_scope: "current_finalized" | "full_project"
  is_full_project_ready: boolean
  finalized_item_count: number
  total_item_count: number
}

export function getProjectExports(
  projectId: string,
): Promise<ApiResult<ApiExportPackage[]>> {
  return apiClient.get<ApiExportPackage[]>(`/projects/${projectId}/exports`)
}

export function getTaskAnnotationExportNormalized(
  taskId: string,
  createdBy?: number,
): Promise<ApiResult<unknown>> {
  const params = new URLSearchParams({ format: "normalized_json" })
  if (createdBy !== undefined) {
    params.set("created_by", String(createdBy))
  }

  return apiClient.get<unknown>(`/tasks/${taskId}/export-annotations?${params.toString()}`)
}
