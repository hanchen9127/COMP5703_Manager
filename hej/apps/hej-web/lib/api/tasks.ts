/**
 * Tasks API module.
 *
 * Wraps backend endpoints:
 *   GET  /projects/{project_id}/tasks
 *   GET  /tasks/{task_id}
 *   POST /projects/{project_id}/tasks
 *   PUT  /projects/{project_id}/tasks/{task_id}
 *
 * `CreateTaskPayload` / `UpdateTaskPayload` mirror `TaskCreate` at
 * apps/hej-api/app/schemas/tasks.py (snake_case wire bodies).
 */
import { apiClient, type ApiResult } from "./client"

export type ApiAnnotationMode = "ai_assisted" | "human_first"
export type ApiTaskType = "image" | "text" | "audio"
export type ApiTaskStatus = "draft" | "ready" | "in_review" | "disputed" | "completed"

export type ApiTask = {
  id: string
  project_id: string
  title: string
  description: string | null
  judgment_question: string
  task_type: ApiTaskType
  annotation_mode: ApiAnnotationMode
  label_schema_ref: string
  text_span_label_options?: string[] | null
  review_policy_ref: string | null
  dispute_policy_ref: string | null
  export_policy_ref: string | null
  status: ApiTaskStatus
  created_at: string
  created_by: string | null
  updated_at: string | null
  updated_by: string | null
}

export type CreateTaskPayload = {
  title: string
  description?: string | null
  judgment_question: string
  task_type: ApiTaskType
  annotation_mode: ApiAnnotationMode
  label_schema_ref: string
  text_span_label_options?: string[] | null
  review_policy_ref?: string | null
  dispute_policy_ref?: string | null
  export_policy_ref?: string | null
}

/** Mirrors backend `TaskUpdate` for `PUT .../tasks/{task_id}`. */
export type UpdateTaskPayload = {
  title?: string
  description?: string | null
  judgment_question?: string
  task_type?: ApiTaskType
  annotation_mode?: ApiAnnotationMode
  label_schema_ref?: string | null
  text_span_label_options?: string[] | null
  review_policy_ref?: string | null
  dispute_policy_ref?: string | null
  export_policy_ref?: string | null
}

export function completeTask(
  projectId: string,
  taskId: string,
): Promise<ApiResult<ApiTask>> {
  return apiClient.post<ApiTask>(`/projects/${projectId}/tasks/${taskId}/complete`)
}

export function listTasks(projectId: string): Promise<ApiResult<ApiTask[]>> {
  return apiClient.get<ApiTask[]>(`/projects/${projectId}/tasks`)
}

export function getTask(taskId: string): Promise<ApiResult<ApiTask>> {
  return apiClient.get<ApiTask>(`/tasks/${taskId}`)
}

export function createTask(
  projectId: string,
  payload: CreateTaskPayload,
): Promise<ApiResult<ApiTask>> {
  return apiClient.post<ApiTask>(`/projects/${projectId}/tasks`, payload)
}

export function updateTask(
  projectId: string,
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<ApiResult<ApiTask>> {
  return apiClient.put<ApiTask>(`/projects/${projectId}/tasks/${taskId}`, payload)
}

export type DatasetItemPayload = {
  external_item_ref: string
  location_ref: string
  payload_preview?: Record<string, unknown>
  access_policy_ref?: string | null
  source_version_ref?: string | null
}

export type DatasetRegistrationResponse = {
  task_id: string
  created_data_pointers: unknown[]
  created_task_items: unknown[]
}

export function registerTaskDataset(
  taskId: string,
  items: DatasetItemPayload[],
): Promise<ApiResult<DatasetRegistrationResponse>> {
  return apiClient.post<DatasetRegistrationResponse>(
    `/tasks/${taskId}/dataset-registration`,
    { items },
  )
}
