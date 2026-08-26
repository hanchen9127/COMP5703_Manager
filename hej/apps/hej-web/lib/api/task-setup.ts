/**
 * Task Setup read API — aggregate definition, policy, and data plane.
 */
import type { ApiResolvedPolicy } from "./policies"
import { apiClient, type ApiResult } from "./client"
import type { ApiAnnotationMode, ApiTask, ApiTaskStatus, ApiTaskType } from "./tasks"

export type ApiDataPointer = {
  id: string
  task_id: string
  location_ref: string
  access_policy_ref: string | null
  source_version_ref: string | null
  created_at: string
}

export type ApiTaskItemSetup = {
  id: string
  task_id: string
  data_pointer_id: string
  external_item_ref: string
  location_ref: string | null
  status: string
  payload_preview: Record<string, unknown>
  created_at: string
  updated_at: string | null
}

export type SetupRegistrationStatus = "pending_registration" | "partial" | "registered"

export type ApiTaskSetupDataPlane = {
  pointer_count: number
  item_count: number
  registration_status: SetupRegistrationStatus
  storage_provider_hint: string | null
}

export type ApiTaskSetup = {
  task: ApiTask
  resolved_policy: ApiResolvedPolicy
  data_pointers: ApiDataPointer[]
  task_items: ApiTaskItemSetup[]
  data_plane: ApiTaskSetupDataPlane
}

export function getTaskSetup(taskId: string): Promise<ApiResult<ApiTaskSetup>> {
  return apiClient.get<ApiTaskSetup>(`/tasks/${taskId}/setup`)
}

export function listTaskDataPointers(taskId: string): Promise<ApiResult<ApiDataPointer[]>> {
  return apiClient.get<ApiDataPointer[]>(`/tasks/${taskId}/data-pointers`)
}

export type { ApiAnnotationMode, ApiTaskStatus, ApiTaskType }
