import { apiClient, type ApiResult } from "./client"

export type ApiTaskItemContentKind = "text" | "image" | "audio"
export type ApiTaskItemContentSource = "uploads" | "mock_fixture"

export type ApiTaskItemContent = {
  content_kind: ApiTaskItemContentKind
  text: string | null
  media_url: string | null
  location_ref: string
  source: ApiTaskItemContentSource
  truncated: boolean
  filename?: string | null
  mime_type?: string | null
  size?: number | null
  duration_seconds?: number | null
}

export function getTaskItemContent(
  taskId: string,
  taskItemId: string,
): Promise<ApiResult<ApiTaskItemContent>> {
  return apiClient.get<ApiTaskItemContent>(`/tasks/${taskId}/task-items/${taskItemId}/content`)
}
