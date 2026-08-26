/**
 * Task items API module.
 *
 * Wraps backend endpoints used by the task item workspace:
 *   GET /tasks/{task_id}/task-items
 *   GET /task-items/{task_item_id}/drafts
 *   POST /task-items/{task_item_id}/drafts
 *   PATCH /drafts/{draft_id}
 *   POST /drafts/{draft_id}/submit
 *
 * Annotate actions intentionally use the real draft API shape:
 * save = create or update a pending draft, submit = save then submit
 * that draft. Review actions use {@link ../review-actions} (POST
 * ``/tasks/.../review-actions``); legacy helpers below remain for older
 * experiments and are not used by the work panel.
 */
import type { AnnotateActionPayload, ReviewActionPayload } from "@/lib/task-item-actions"
import { apiClient, type ApiError, type ApiResult } from "./client"

export type ApiTaskItemStatus =
  | "pending"
  | "annotated"
  | "returned"
  | "rejected"
  | "reviewed"
  | "disputed"
  | "expert_send_back"
  | "canonicalized"

export type ApiTaskItem = {
  id: string
  task_id: string
  data_pointer_id: string
  external_item_ref: string
  location_ref: string
  status: ApiTaskItemStatus
  // Backend declares `payload_preview` as `dict[str, Any]`, so individual
  // values can be strings, numbers, booleans, or nested objects depending
  // on the underlying data pointer. Widened from `Record<string, string>`
  // for honesty; callers should narrow per-key when rendering.
  payload_preview: Record<string, unknown>
  created_at: string
  updated_at: string | null
}

export type ApiDraft = {
  id: string
  task_item_id: string
  annotation_id?: string | null
  status: string
  annotation_type: string
  draft_data: Record<string, unknown>
  revision_notes?: string | null
  created_by?: number | null
  created_at: string
  submitted_at?: string | null
  updated_at?: string | null
}

export type ApiDraftListResponse = {
  task_item_id: string
  drafts: ApiDraft[]
  total_count: number
}

export type ApiDraftSubmitResponse = {
  id: string
  status: string
  submitted_at?: string | null
  message: string
}

export type DraftActionData = {
  draft: ApiDraft
  submit?: ApiDraftSubmitResponse
}

type DraftWritePayload = {
  annotation_type: string
  draft_data: Record<string, unknown>
  revision_notes?: string
}

/**
 * Mutation outcome for production API writes.
 *
 * Backend/API failures must remain explicit failures; production data
 * boundaries must not convert failed writes into synthetic successes.
 */
export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export function listTaskItems(taskId: string): Promise<ApiResult<ApiTaskItem[]>> {
  return apiClient.get<ApiTaskItem[]>(`/tasks/${taskId}/task-items`)
}

export function listDraftsForTaskItem(
  itemId: string
): Promise<ApiResult<ApiDraftListResponse>> {
  return apiClient.get<ApiDraftListResponse>(`/task-items/${itemId}/drafts`)
}

function mutationFailure<T>(action: string, error: ApiError): MutationResult<T> {
  if (typeof console !== "undefined") {
    console.warn(`[api/task-items] ${action} failed:`, error)
  }
  return { ok: false, error }
}

function parseAnnotationOutput(outputText: string): unknown {
  const trimmed = outputText.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return outputText
  }
}

function buildAnnotationDraftPayload(
  payloadText: string,
  notes: string | undefined
): DraftWritePayload {
  return {
    annotation_type: "annotation",
    draft_data: {
      output: parseAnnotationOutput(payloadText),
      output_text: payloadText,
      notes: notes ?? "",
    },
    revision_notes: notes,
  }
}

function buildJudgementDraftPayload(payload: AnnotateActionPayload): DraftWritePayload {
  const { result } = payload
  return {
    annotation_type: "judgement",
    draft_data: {
      verdict: result.verdict ?? "",
      rationale: result.rationale ?? "",
    },
    revision_notes: result.rationale,
  }
}

function buildDraftPayload(payload: AnnotateActionPayload): DraftWritePayload {
  const { result } = payload
  if (result.payloadText !== undefined) {
    return buildAnnotationDraftPayload(result.payloadText, result.notes)
  }

  return buildJudgementDraftPayload(payload)
}

function findPendingDraft(drafts: ApiDraft[]): ApiDraft | undefined {
  return drafts.find((draft) => draft.status === "pending")
}

type UpsertDraftOptions = {
  forceCreatePending?: boolean
}

const RESUBMIT_STATUSES = new Set(["returned", "rejected", "expert_send_back"])

function shouldForceCreatePendingDraft(status: string | undefined): boolean {
  if (!status) return false
  return RESUBMIT_STATUSES.has(status.trim().toLowerCase())
}

async function upsertDraft(
  itemId: string,
  payload: AnnotateActionPayload,
  options: UpsertDraftOptions = {}
): Promise<MutationResult<ApiDraft>> {
  const writePayload = buildDraftPayload(payload)
  const draftList = await listDraftsForTaskItem(itemId)
  if (!draftList.ok) {
    return mutationFailure("list-drafts", draftList.error)
  }

  const pendingDraft = options.forceCreatePending
    ? undefined
    : findPendingDraft(draftList.data.drafts)
  const createDraft = !pendingDraft
  const result = createDraft
    ? await apiClient.post<ApiDraft>(`/task-items/${itemId}/drafts`, writePayload)
    : await apiClient.patch<ApiDraft>(`/drafts/${pendingDraft.id}`, writePayload)

  if (!result.ok) {
    return mutationFailure(createDraft ? "create-draft" : "update-draft", result.error)
  }

  return { ok: true, data: result.data }
}

async function postItemAction(
  taskId: string,
  itemId: string,
  action: string,
  body: unknown
): Promise<MutationResult<ApiTaskItem>> {
  const result = await apiClient.post<ApiTaskItem>(
    `/tasks/${taskId}/task-items/${itemId}/${action}`,
    body
  )
  if (result.ok) {
    return { ok: true, data: result.data }
  }
  return mutationFailure(action, result.error)
}

export function saveDraft(
  taskId: string,
  itemId: string,
  payload: AnnotateActionPayload
): Promise<MutationResult<DraftActionData>> {
  void taskId
  return upsertDraft(itemId, payload).then((result) =>
    result.ok
      ? { ok: true, data: { draft: result.data } }
      : result
  )
}

export async function submitTaskItem(
  taskId: string,
  itemId: string,
  payload: AnnotateActionPayload
): Promise<MutationResult<DraftActionData>> {
  void taskId
  const savedDraft = await upsertDraft(itemId, payload, {
    forceCreatePending: shouldForceCreatePendingDraft(payload.itemStatus),
  })
  if (!savedDraft.ok) {
    return savedDraft
  }

  const writePayload = buildDraftPayload(payload)
  const submitResult = await apiClient.post<ApiDraftSubmitResponse>(
    `/drafts/${savedDraft.data.id}/submit`,
    { revision_notes: writePayload.revision_notes }
  )
  if (!submitResult.ok) {
    return mutationFailure("submit-draft", submitResult.error)
  }

  return {
    ok: true,
    data: { draft: savedDraft.data, submit: submitResult.data },
  }
}

export function approveTaskItem(
  taskId: string,
  itemId: string,
  payload: ReviewActionPayload
): Promise<MutationResult<ApiTaskItem>> {
  return postItemAction(taskId, itemId, "approve", payload)
}

export function rejectTaskItem(
  taskId: string,
  itemId: string,
  payload: ReviewActionPayload
): Promise<MutationResult<ApiTaskItem>> {
  return postItemAction(taskId, itemId, "reject", payload)
}

export function escalateTaskItem(
  taskId: string,
  itemId: string,
  payload: ReviewActionPayload
): Promise<MutationResult<ApiTaskItem>> {
  return postItemAction(taskId, itemId, "escalate", payload)
}
