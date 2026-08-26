import { hejApiBaseUrl } from "@/lib/api-config"
import { getAuthToken } from "@/lib/api/auth"
import { normalizeAnnotationData } from "@/lib/annotation-data"
import {
  TASK_ITEM_STATUS,
  TASK_STATUS,
  type MockTaskItemStatus,
} from "@/lib/domain/task-status"

import {
  mapBackendItemStatusOrDefault,
  normalizeTaskItemStatus,
} from "@/lib/api/status-mapping"
import type { ApiDraft, ApiTaskItemStatus } from "@/lib/api/task-items"
import type {
  MockTask,
  MockTaskItem,
  TaskAssignment,
  WorkflowStep,
} from "@/lib/domain/task-types"
import type { MockProject } from "@/lib/domain/project-types"
import type { ActivityEvent } from "@/lib/domain/admin-types"

type ApiTask = {
  task_type?: string | null
  text_span_label_options?: unknown
  annotation_mode?: string | null
}

function normalizeWorkspaceTaskType(value: unknown): "text" | "image" | "audio" | null {
  return value === "image" || value === "text" || value === "audio" ? value : null
}

function resolveWorkspaceTaskType(
  apiTask: ApiTask | null,
  fallbackTaskType: "text" | "image" | "audio",
): "text" | "image" | "audio" {
  return normalizeWorkspaceTaskType(apiTask?.task_type) ?? fallbackTaskType
}

function resolveWorkspaceExecutionMode(
  apiTask: ApiTask | null,
  fallback: "ai_assisted" | "human_first",
): "ai_assisted" | "human_first" {
  return apiTask?.annotation_mode === "ai_assisted" ? "ai_assisted" : fallback
}

function normalizeApiTextSpanLabelOptions(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const labels = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0)
  return labels.length > 0 ? labels : null
}

type ApiTaskItem = {
  id?: string
  // `task_id` is on the wire but intentionally ignored: the caller-supplied
  // `taskId` (from the route param / mock view) is authoritative for the
  // local MockTaskItem. Declared here only so the shape is documented.
  task_id?: unknown
  external_item_ref?: string
  // `location_ref` is part of the real backend contract (see
  // `lib/api/task-items.ts` `ApiTaskItem`) but is not yet surfaced on
  // `MockTaskItem`. Typed here so the shape is acknowledged and so
  // unexpected values can be detected defensively without propagating
  // them to the UI layer this PR.
  location_ref?: unknown
  status?: string
  payload_preview?: Record<string, unknown> | null
}

function isApiTaskItem(value: unknown): value is ApiTaskItem {
  return Boolean(value && typeof value === "object")
}

function isApiTask(value: unknown): value is ApiTask {
  return Boolean(value && typeof value === "object")
}

function readApiTaskItemsPayload(payload: unknown): ApiTaskItem[] {
  if (Array.isArray(payload)) {
    return payload.filter(isApiTaskItem)
  }
  if (!payload || typeof payload !== "object") {
    return []
  }
  const candidate = payload as Record<string, unknown>
  const items =
    candidate.items ??
    candidate.data ??
    candidate.taskItems ??
    candidate.task_items ??
    candidate.results ??
    []
  return Array.isArray(items) ? items.filter(isApiTaskItem) : []
}

const KNOWN_API_STATUSES: readonly ApiTaskItemStatus[] = [
  "pending",
  "annotated",
  "returned",
  "rejected",
  "reviewed",
  "disputed",
  "expert_send_back",
  "canonicalized",
]

let locationRefShapeWarned = false

function noteLocationRefShape(raw: unknown): void {
  if (raw == null || typeof raw === "string") return
  if (locationRefShapeWarned) return
  console.warn("Unexpected location_ref shape from API:", typeof raw)
  locationRefShapeWarned = true
}

function readPreviewField(payload: Record<string, unknown>, key: string): string | undefined {
  const raw = payload[key]
  if (raw == null) return undefined
  const s = String(raw).trim()
  return s === "" ? undefined : s
}

function readTaskItemPreview(payload: Record<string, unknown> | null | undefined): string | undefined {
  if (!payload) {
    return undefined
  }
  return (
    readPreviewField(payload, "preview") ??
    readPreviewField(payload, "summary") ??
    readPreviewField(payload, "text")
  )
}

// UI/display formatting shim: MockTaskItem still requires string display fields.
export function formatTaskItemPreview(value: string | null | undefined): string {
  const formatted = value != null ? String(value).trim() : ""
  return formatted !== "" ? formatted : "No preview available"
}

export function formatTaskItemAiLabel(value: string | null | undefined): string {
  const formatted = value != null ? String(value).trim() : ""
  return formatted !== "" ? formatted : "unknown"
}

export function formatTaskItemConfidence(raw: unknown): string {
  if (raw == null || raw === "") {
    return "n/a"
  }
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) {
      return "n/a"
    }
    return Number.isInteger(raw) ? String(raw) : String(raw)
  }
  const s = String(raw).trim()
  return s === "" ? "n/a" : s
}

// Translate a raw backend status string into the UI status enum.
function mapApiStatusToMockWithMeta(raw: string | undefined | null): {
  status: MockTaskItemStatus
  apiOriginalStatus?: string
} {
  if (typeof raw !== "string") {
    return { status: TASK_ITEM_STATUS.UNSTARTED }
  }
  const s = raw.trim()
  if (s === "") {
    return { status: TASK_ITEM_STATUS.UNSTARTED }
  }
  if ((KNOWN_API_STATUSES as readonly string[]).includes(s)) {
    return { status: mapBackendItemStatusOrDefault(s as ApiTaskItemStatus) }
  }
  console.warn("Unknown task item status from API:", s)
  return { status: TASK_ITEM_STATUS.UNSTARTED, apiOriginalStatus: s }
}

export function mapApiItemToMock(taskId: string, item: ApiTaskItem): MockTaskItem {
  const payload = item.payload_preview ?? undefined
  const statusMeta = mapApiStatusToMockWithMeta(item.status)
  const id = (item.id && String(item.id).trim()) || "unknown_item_id"
  const extRaw = item.external_item_ref
  const externalRef =
    (extRaw != null && String(extRaw).trim() !== "" && String(extRaw).trim()) || id || "unknown_ref"
  noteLocationRefShape(item.location_ref)

  const aiRaw =
    payload != null
      ? (readPreviewField(payload as Record<string, unknown>, "ai_label") ??
          readPreviewField(payload as Record<string, unknown>, "label"))
      : undefined

  const confRaw = payload != null ? (payload as Record<string, unknown>).confidence : undefined

  const locationRef =
    item.location_ref != null && String(item.location_ref).trim() !== ""
      ? String(item.location_ref).trim()
      : undefined

  return {
    id,
    taskId,
    externalRef,
    locationRef,
    preview: formatTaskItemPreview(readTaskItemPreview(payload ?? null)),
    aiLabel: formatTaskItemAiLabel(aiRaw),
    confidence: formatTaskItemConfidence(confRaw),
    status: statusMeta.status,
    ...(statusMeta.apiOriginalStatus ? { apiOriginalStatus: statusMeta.apiOriginalStatus } : {}),
  }
}

function stringifyDraftValue(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed === "" ? undefined : trimmed
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function hasMeaningfulDraftData(draft: ApiDraft): boolean {
  const data = draft.draft_data ?? {}
  const explicitFields = [
    data.output_text,
    data.output,
    data.annotation_output,
    data.verdict,
    data.rationale,
    data.notes,
    draft.revision_notes,
  ]
  if (explicitFields.some((value) => stringifyDraftValue(value))) {
    return true
  }
  return Object.values(data).some((value) => {
    if (Array.isArray(value)) return value.length > 0
    if (value && typeof value === "object") return Object.keys(value).length > 0
    return false
  })
}

/** Draft hydration must not downgrade API-backed workflow states (e.g. after dual sign-off). */
function resolveItemStatusAfterDraft(
  item: MockTaskItem,
  latestDraft: ApiDraft,
): MockTaskItemStatus {
  const normalized = normalizeTaskItemStatus(item.status)

  if (
    normalized === "approved" ||
    normalized === "returned" ||
    normalized === "rejected" ||
    normalized === "disputed"
  ) {
    return item.status
  }

  if (latestDraft.status === "submitted") {
    return TASK_ITEM_STATUS.SUBMITTED
  }
  if (item.status === TASK_ITEM_STATUS.UNSTARTED) {
    return TASK_ITEM_STATUS.IN_PROGRESS
  }
  return item.status
}

export function applyApiDraftsToMockItem(
  item: MockTaskItem,
  drafts: ApiDraft[],
  taskType: "text" | "image" | "audio"
): MockTaskItem {
  const latestDraft =
    drafts.find((draft) => draft.status === "submitted") ??
    drafts.find((draft) => draft.status === "pending" && hasMeaningfulDraftData(draft))
  if (!latestDraft) return item

  const draftData = latestDraft.draft_data ?? {}
  const annotationSource = draftData.output ?? draftData.annotation_output ?? draftData
  const annotationData = normalizeAnnotationData(annotationSource, taskType)
  const verdict = stringifyDraftValue(draftData.verdict)
  const rationale =
    stringifyDraftValue(draftData.rationale) ??
    stringifyDraftValue(draftData.notes) ??
    latestDraft.revision_notes ??
    undefined
  const payloadText =
    stringifyDraftValue(draftData.output_text) ??
    stringifyDraftValue(draftData.output) ??
    stringifyDraftValue(draftData.annotation_output)
  const notes =
    stringifyDraftValue(draftData.notes) ??
    latestDraft.revision_notes ??
    undefined

  return {
    ...item,
    status: resolveItemStatusAfterDraft(item, latestDraft),
    draftAnnotationData: annotationData,
    ...(verdict ? { draftVerdict: verdict } : {}),
    ...(rationale ? { draftRationale: rationale } : {}),
    ...(payloadText ? { draftPayloadText: payloadText } : {}),
    ...(notes ? { draftNotes: notes } : {}),
  }
}

function mapApiItemsToMock(apiItems: ApiTaskItem[], taskId: string): MockTaskItem[] {
  return apiItems.map((apiItem) => mapApiItemToMock(taskId, apiItem))
}

async function fetchApiTaskItems(taskId: string): Promise<ApiTaskItem[]> {
  const url = `${hejApiBaseUrl}/tasks/${taskId}/task-items`
  const response = await fetch(url, {
    cache: "no-store",
  })

  const rawText = await response.text().catch(() => "")
  let rawPayload: unknown = null
  if (rawText) {
    try {
      rawPayload = JSON.parse(rawText)
    } catch {
      rawPayload = rawText
    }
  }

  const normalized = readApiTaskItemsPayload(rawPayload)

  if (!response.ok) {
    throw new Error(`Task items API request failed: ${response.status}`)
  }

  return normalized
}

async function fetchApiTask(taskId: string): Promise<ApiTask | null> {
  const url = `${hejApiBaseUrl}/tasks/${taskId}`
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) return null
  const payload = (await response.json().catch(() => null)) as unknown
  return isApiTask(payload) ? payload : null
}

export async function getTaskWorkspaceView(taskId: string) {
  const bridge = buildBackendBridgeWorkspaceView(taskId)

  if (!bridge) {
    return null
  }

  if (typeof window === "undefined" && !getAuthToken()) {
    return bridge
  }

  const apiTask = await fetchApiTask(taskId)
  bridge.task.taskType = resolveWorkspaceTaskType(apiTask, bridge.task.taskType)
  bridge.task.executionMode = resolveWorkspaceExecutionMode(apiTask, bridge.task.executionMode)
  bridge.task.textSpanLabelOptions = normalizeApiTextSpanLabelOptions(apiTask?.text_span_label_options)

  try {
    const apiItems = await fetchApiTaskItems(taskId)
    const taskItems = mapApiItemsToMock(apiItems, taskId)

    return {
      ...bridge,
      taskItems,
      apiError: false,
    }
  } catch (error) {
    console.warn("[task-workspace-data] backend bridge task items failed", {
      taskId,
      error,
    })

    return {
      ...bridge,
      apiError: true,
    }
  }
}

// Heuristic: route task IDs share the `task_` prefix in both the
// frontend mock catalog and backend seed data.
function looksLikeTaskId(taskId: string): boolean {
  return taskId.startsWith("task_") && taskId.length > "task_".length
}

export type BridgeTaskWorkspaceView = {
  task: MockTask
  project: MockProject
  taskItems: MockTaskItem[]
  // Empty lists keep the shell shape-compatible with the workspace panels.
  workflow: WorkflowStep[]
  assignments: TaskAssignment[]
  activity: ActivityEvent[]
  // `false` keeps the bridge distinct from an API-fallback state.
  apiError: false
}

/**
 * Minimal workspace shell for backend-only task IDs.
 * Kept at the page/layout call sites so other task routes preserve their
 * existing `notFound()` behavior for backend-only IDs.
 */
export function buildBackendBridgeWorkspaceView(
  taskId: string,
): BridgeTaskWorkspaceView | null {
  if (!looksLikeTaskId(taskId)) {
    return null
  }

  const task: MockTask = {
    id: taskId,
    projectId: "unknown_project",
    title: `Backend task ${taskId}`,
    judgmentQuestion: "",
    taskClass: "annotation",
    taskType: "text",
    executionMode: "human_first",
    dataSourceLabel: "Real backend data",
    annotationRules: "",
    outputSchemaRef: "",
    reviewPolicyRef: "",
    status: TASK_STATUS.ACTIVE,
  }

  const project: MockProject = {
    id: "unknown_project",
    organizationId: "unknown_org",
    name: "Real backend",
    description: "",
    status: "active",
    governanceModel: "standard",
  }

  return {
    task,
    project,
    taskItems: [],
    workflow: [],
    assignments: [],
    activity: [],
    apiError: false,
  }
}
