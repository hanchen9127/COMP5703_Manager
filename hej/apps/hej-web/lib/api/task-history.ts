/**
 * Task history API: audit activity stream and derived workflow lineage.
 */
import { apiClient, type ApiResult } from "./client"

export type HistoryCategory =
  | "setup"
  | "policy"
  | "data"
  | "annotation"
  | "review"
  | "dispute"
  | "system"

export type HistoryActor = {
  kind: "user" | "system"
  id: number | null
  display_name: string
}

export type HistoryResource = {
  type: string
  id: string
  label?: string | null
}

export type HistoryChange = {
  field: string
  before: unknown
  after: unknown
}

export type TaskHistoryEvent = {
  id: number
  occurred_at: string
  category: HistoryCategory
  operation: string
  summary: string
  detail: string | null
  actor: HistoryActor
  resource: HistoryResource | null
  changes: HistoryChange[]
}

export type TaskAuditLogsResponse = {
  task_id: string
  project_id: string | null
  total_count: number
  logs: TaskHistoryEvent[]
}

export type TaskItemCounts = {
  total: number
  pending: number
  annotated: number
  reviewed: number
  disputed: number
  canonicalized: number
}

export type WorkflowStepState =
  | "pending"
  | "in_progress"
  | "complete"
  | "blocked"
  | "later"

export type WorkflowStep = {
  key: string
  title: string
  description: string
  state: WorkflowStepState
  tone: "default" | "accent" | "dark"
  evidence: string | null
  filter_categories?: HistoryCategory[]
  workspace_tab?: string | null
}

export type TaskWorkflowLineageResponse = {
  task_id: string
  task_status: string
  annotation_mode: string
  generated_at: string
  item_counts: TaskItemCounts
  open_escalations: number
  steps: WorkflowStep[]
  current_step_key: string | null
  headline?: string
  next_action?: string
}

export type ListTaskAuditLogsParams = {
  limit?: number
  offset?: number
  category?: HistoryCategory
}

export function getTaskAuditLogs(
  taskId: string,
  params: ListTaskAuditLogsParams = {},
): Promise<ApiResult<TaskAuditLogsResponse>> {
  const search = new URLSearchParams()
  if (params.limit != null) search.set("limit", String(params.limit))
  if (params.offset != null) search.set("offset", String(params.offset))
  if (params.category) search.set("category", params.category)
  const query = search.toString()
  return apiClient.get<TaskAuditLogsResponse>(
    `/tasks/${taskId}/audit-logs${query ? `?${query}` : ""}`,
  )
}

export function getTaskWorkflowLineage(
  taskId: string,
): Promise<ApiResult<TaskWorkflowLineageResponse>> {
  return apiClient.get<TaskWorkflowLineageResponse>(
    `/tasks/${taskId}/workflow-lineage`,
  )
}
