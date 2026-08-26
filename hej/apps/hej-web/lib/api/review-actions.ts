/**
 * Task-item review, escalation routing, adjustment read, and finalized listing.
 *
 * All calls go through {@link apiClient} (JWT + base URL).
 */
import { apiClient, type ApiResult } from "./client"
import type { MutationResult } from "./task-items"

export type ReviewWireAction = "accept" | "reject" | "adjust" | "revise" | "escalate"

export type EscalationTarget = "secondary_reviewer" | "expert"

export type TaskItemReviewActionRequestBody = {
  action: ReviewWireAction
  comment?: string | null
  final_payload?: string | null
  final_verdict?: string | null
}

export type TaskItemReviewActionResponseBody = {
  review_id: string
  review_status: string
  next_ui_status: string
  review_mode?: "dual_signoff" | "single_pass"
  approvals_received?: number
  approvals_required?: number
}

export type TaskItemAdjustmentReadBody = {
  task_id: string
  task_item_id: string
  base_status: string
  payload_preview: Record<string, unknown>
  last_submitted_payload: Record<string, unknown> | null
  reviewer_note: string | null
  routed_by: string | null
  routed_at: string | null
}

export type EscalationRouteRequestBody = {
  target: EscalationTarget
  assignee_ref?: string | null
  note?: string | null
}

export type EscalationRouteResponseBody = {
  task_item_id: string
  target: EscalationTarget
  assignee_ref: string | null
  routed_at: string
  next_status: string
}

export type EscalationDecisionRequestBody = {
  decision: "finalize" | "send_back"
  note?: string | null
  payload_preview?: Record<string, unknown> | null
}

export type EscalationDecisionResponseBody = {
  next_status: string
  payload_preview: Record<string, unknown>
}

export type EscalationListItemBody = {
  task_item_id: string
  external_item_ref?: string | null
  status: string
  target: EscalationTarget | null
  assignee_ref: string | null
  routed_at: string | null
  note: string | null
}

export type EscalationListResponseBody = {
  task_id: string
  items: EscalationListItemBody[]
}

export type FinalizedTaskItemReadBody = {
  id: string
  task_id: string
  external_item_ref?: string | null
  status: string
  finalized_at: string | null
}

export type FinalizedItemsResponseBody = {
  task_id: string
  items: FinalizedTaskItemReadBody[]
}

function buildTaskItemReviewActionRequestBody(body: TaskItemReviewActionRequestBody) {
  return {
    action: body.action,
    comment: body.comment ?? null,
    final_payload: body.final_payload ?? null,
    final_verdict: body.final_verdict ?? null,
  }
}

export async function submitTaskItemReviewAction(
  taskId: string,
  itemId: string,
  body: TaskItemReviewActionRequestBody
): Promise<MutationResult<TaskItemReviewActionResponseBody>> {
  const result = await apiClient.post<TaskItemReviewActionResponseBody>(
    `/tasks/${taskId}/task-items/${itemId}/review-actions`,
    buildTaskItemReviewActionRequestBody(body)
  )
  if (result.ok) {
    return { ok: true, data: result.data }
  }
  return { ok: false, error: result.error }
}

export async function getTaskItemAdjustment(
  taskId: string,
  itemId: string
): Promise<ApiResult<TaskItemAdjustmentReadBody>> {
  return apiClient.get<TaskItemAdjustmentReadBody>(
    `/tasks/${taskId}/task-items/${itemId}/adjustment`
  )
}

function buildEscalationRouteRequestBody(body: EscalationRouteRequestBody) {
  return {
    target: body.target,
    assignee_ref: body.assignee_ref ?? null,
    note: body.note ?? null,
  }
}

export async function routeTaskItemEscalation(
  taskId: string,
  itemId: string,
  body: EscalationRouteRequestBody
): Promise<MutationResult<EscalationRouteResponseBody>> {
  const result = await apiClient.post<EscalationRouteResponseBody>(
    `/tasks/${taskId}/task-items/${itemId}/escalations/route`,
    buildEscalationRouteRequestBody(body)
  )
  if (result.ok) {
    return { ok: true, data: result.data }
  }
  return { ok: false, error: result.error }
}

function buildEscalationDecisionRequestBody(body: EscalationDecisionRequestBody) {
  return {
    decision: body.decision,
    note: body.note ?? null,
    payload_preview: body.payload_preview ?? null,
  }
}

export async function decideTaskItemEscalation(
  taskId: string,
  itemId: string,
  body: EscalationDecisionRequestBody
): Promise<MutationResult<EscalationDecisionResponseBody>> {
  const result = await apiClient.post<EscalationDecisionResponseBody>(
    `/tasks/${taskId}/task-items/${itemId}/escalations/decision`,
    buildEscalationDecisionRequestBody(body)
  )
  if (result.ok) {
    return { ok: true, data: result.data }
  }
  return { ok: false, error: result.error }
}

export async function listTaskEscalations(
  taskId: string
): Promise<ApiResult<EscalationListResponseBody>> {
  return apiClient.get<EscalationListResponseBody>(`/tasks/${taskId}/escalations`)
}

export async function listFinalizedTaskItems(
  taskId: string
): Promise<ApiResult<FinalizedItemsResponseBody>> {
  return apiClient.get<FinalizedItemsResponseBody>(`/tasks/${taskId}/finalized-items`)
}

export async function getFinalizedTaskItem(
  taskId: string,
  itemId: string
): Promise<ApiResult<FinalizedTaskItemReadBody>> {
  return apiClient.get<FinalizedTaskItemReadBody>(
    `/tasks/${taskId}/finalized-items/${itemId}`
  )
}
