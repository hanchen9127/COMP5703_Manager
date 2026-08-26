/**
 * Task display labels and table value helpers (pure utility module).
 *
 * Design goals:
 * 1) Keep components (tables, filters, page headers) from hardcoding strings or status mappings here so copy changes and i18n are centralized.
 * 2) Judgement and annotation task items expose different fields on `MockTaskItem`.
 *    The rules for the main value and signal columns live here to avoid duplicating `if/else` logic across tables.
 *
 * Sections:
 * - `formatTaskLabel` / `formatTaskClassLabel`: generic string helpers and task class labels.
 * - `getJudgement*` / `getTaskItemValue` / `getTaskItemSignal`: table display values from `MockTaskItem`.
 * - `formatTaskStatusLabel` / `formatTaskItemStatusLabel`: internal status codes to human-readable short labels.
 * - `formatWorkflowStepStateLabel`: normalize workflow step states that may be phrases or snake_case.
 * - `getTaskItemStatusCounts` / `sortTaskItemStatuses`: shared counts and ordering for Overview and Items.
 *
 * Contract with `domain/task-status`:
 * - `TASK_STATUS`, `TASK_ITEM_STATUS`, and `MOCK_TASK_ITEM_STATUS_ORDER` are defined in `domain/task-status`.
 * - The labels in this file should stay aligned with those constants.
 * - When adding a new status: extend `domain/task-status` first, then add the display mapping here, then update the UI.
 */
import {
  MOCK_TASK_ITEM_STATUS_ORDER,
  TASK_ITEM_STATUS,
  TASK_STATUS,
  type MockTaskItemStatus,
  type MockTaskStatus,
} from "@/lib/domain/task-status"

import { getTaskItemStatusDisplayLabel } from "./api/status-mapping"
import type { MockTask, MockTaskItem } from "@/lib/domain/task-types"

/** Convert snake_case labels into spaced human-readable text. */
export function formatTaskLabel(value: string) {
  return value.replaceAll("_", " ")
}

/** Task class labels: annotation vs judgement. */
export function formatTaskClassLabel(value: "annotation" | "judgement") {
  return value === "judgement" ? "Judgement" : "Annotation"
}

/** Judgement task items: return the highest-priority display value (canonical > review > draft > candidate > AI label). */
export function getJudgementDisplayValue(item: MockTaskItem) {
  return (
    item.canonicalVerdict ??
    item.reviewDecision ??
    item.draftVerdict ??
    item.candidateOutput ??
    item.aiLabel
  )
}

/** Judgement task items: display confidence/signal value. */
export function getJudgementSignalValue(item: MockTaskItem) {
  return item.candidateConfidence ?? item.confidence
}

/** Judgement task items: return the highest-priority rationale text. */
export function getJudgementRationale(item: MockTaskItem) {
  return (
    item.canonicalRationale ??
    item.reviewNote ??
    item.draftRationale ??
    item.candidateRationale ??
    ""
  )
}

/** Draft annotation display text fallback for tables/boards (read-only; not used for persistence). */
export function getDraftAnnotationDisplayText(item: MockTaskItem): string | undefined {
  if (item.draftPayloadText && item.draftPayloadText.trim() !== "") {
    return item.draftPayloadText
  }
  if (item.draftAnnotationData?.kind === "text") {
    const text = (item.draftAnnotationData as { text?: string }).text?.trim() ?? ""
    if (text !== "") {
      return text
    }
  }
  return undefined
}

/** Table/board main value: judgement items use the judgement chain; annotation items prefer human draft output. */
export function getTaskItemValue(task: MockTask, item: MockTaskItem) {
  if (task.taskClass === "judgement") {
    return getJudgementDisplayValue(item)
  }

  return getDraftAnnotationDisplayText(item) ?? item.aiLabel
}

/** Table/board signal column: return confidence-like values only. */
export function getTaskItemSignal(task: MockTask, item: MockTaskItem) {
  if (task.taskClass === "judgement") {
    return getJudgementSignalValue(item)
  }

  return item.confidence
}

/** Human-first items use status labels for workflow state display. */
export function getTaskItemProgressLabel(status: MockTaskItemStatus | string): string {
  return formatTaskItemStatusLabel(status)
}

// --- B2: task-level and item-level status labels and counts (aligned with `domain/task-status`) ---
// Note: keys must match `MockTaskStatus` / `MockTaskItemStatus`, and values are user-facing English short labels.

const TASK_STATUS_LABELS = {
  [TASK_STATUS.DRAFT]: "Draft",
  [TASK_STATUS.ACTIVE]: "Active",
  [TASK_STATUS.UNDER_REVIEW]: "Under review",
  [TASK_STATUS.PILOT]: "Pilot",
} as const satisfies Record<MockTaskStatus, string>

const TASK_ITEM_STATUS_LABELS = {
  [TASK_ITEM_STATUS.UNSTARTED]: "Not started",
  [TASK_ITEM_STATUS.IN_PROGRESS]: "Draft",
  [TASK_ITEM_STATUS.SUBMITTED]: "Submitted",
  [TASK_ITEM_STATUS.RETURNED]: "Returned",
  [TASK_ITEM_STATUS.APPROVED]: "Approved",
  [TASK_ITEM_STATUS.REJECTED]: "Rejected",
  [TASK_ITEM_STATUS.DISPUTED]: "Disputed",
} as const satisfies Record<MockTaskItemStatus, string>

/** Task lifecycle status -> short page-header / badge label (for example, draft -> Draft). */
export function formatTaskStatusLabel(status: MockTaskStatus | string): string {
  if (status in TASK_STATUS_LABELS) {
    return TASK_STATUS_LABELS[status as MockTaskStatus]
  }
  return formatTaskLabel(status)
}

/** Single task item workflow status -> human-readable text (for example, under_review -> Under review). */
export function formatTaskItemStatusLabel(status: MockTaskItemStatus | string): string {
  if (status in TASK_ITEM_STATUS_LABELS) {
    return TASK_ITEM_STATUS_LABELS[status as MockTaskItemStatus]
  }
  return getTaskItemStatusDisplayLabel(status)
}

/** Workflow step state: keep phrases as-is; otherwise convert underscores to spaces. */
export function formatWorkflowStepStateLabel(state: string): string {
  if (state.includes(" ") || state.includes("-")) {
    return state
  }
  return formatTaskLabel(state)
}

/**
 * Counts of `MockTaskItem` records grouped by status.
 * The fields use camelCase so they are convenient to destructure in TypeScript.
 */
export type TaskItemStatusCounts = {
  unstarted: number
  inProgress: number
  submitted: number
  returned: number
  approved: number
  rejected: number
  disputed: number
}

/** Count how many items exist for each status (shared by Overview and Items metric cards). */
export function getTaskItemStatusCounts(items: MockTaskItem[]): TaskItemStatusCounts {
  return {
    unstarted: items.filter((item) => item.status === TASK_ITEM_STATUS.UNSTARTED).length,
    inProgress: items.filter((item) => item.status === TASK_ITEM_STATUS.IN_PROGRESS).length,
    submitted: items.filter((item) => item.status === TASK_ITEM_STATUS.SUBMITTED).length,
    returned: items.filter((item) => item.status === TASK_ITEM_STATUS.RETURNED).length,
    approved: items.filter((item) => item.status === TASK_ITEM_STATUS.APPROVED).length,
    rejected: items.filter((item) => item.status === TASK_ITEM_STATUS.REJECTED).length,
    disputed: items.filter((item) => item.status === TASK_ITEM_STATUS.DISPUTED).length,
  }
}

/** Deduplicate and sort by `MOCK_TASK_ITEM_STATUS_ORDER` so filter badges stay in a fixed order. */
export function sortTaskItemStatuses(statuses: MockTaskItemStatus[]): MockTaskItemStatus[] {
  return [...new Set(statuses)].sort(
    (a, b) => MOCK_TASK_ITEM_STATUS_ORDER.indexOf(a) - MOCK_TASK_ITEM_STATUS_ORDER.indexOf(b)
  )
}

// --- Stage-scoped filter groups (display layer over the internal six statuses) ---

export type StageFilterOption = {
  key: string
  label: string
  statuses: MockTaskItemStatus[]
}

export const ITEMS_PAGE_FILTERS: StageFilterOption[] = [
  { key: "draft", label: "Draft", statuses: [TASK_ITEM_STATUS.UNSTARTED, TASK_ITEM_STATUS.IN_PROGRESS] },
  { key: "submitted", label: "Submitted", statuses: [TASK_ITEM_STATUS.SUBMITTED] },
  { key: "returned", label: "Returned", statuses: [TASK_ITEM_STATUS.RETURNED] },
  { key: "approved", label: "Approved", statuses: [TASK_ITEM_STATUS.APPROVED] },
  { key: "rejected", label: "Rejected", statuses: [TASK_ITEM_STATUS.REJECTED] },
  { key: "disputed", label: "Disputed", statuses: [TASK_ITEM_STATUS.DISPUTED] },
]

export const ANNOTATE_PAGE_FILTERS: StageFilterOption[] = [
  { key: "draft", label: "Draft", statuses: [TASK_ITEM_STATUS.UNSTARTED, TASK_ITEM_STATUS.IN_PROGRESS] },
  { key: "returned", label: "Returned", statuses: [TASK_ITEM_STATUS.RETURNED] },
  { key: "rejected", label: "Rejected", statuses: [TASK_ITEM_STATUS.REJECTED] },
]

export const REVIEW_PAGE_FILTERS: StageFilterOption[] = [
  { key: "submitted", label: "Submitted", statuses: [TASK_ITEM_STATUS.SUBMITTED] },
  { key: "disputed", label: "Disputed", statuses: [TASK_ITEM_STATUS.DISPUTED] },
]

export function getScopeStatuses(filters: StageFilterOption[]): Set<MockTaskItemStatus> {
  return new Set(filters.flatMap((f) => f.statuses))
}

/**
 * Resolve the item shown in the work panel.
 * Prefer the filtered table row, but fall back to the full inventory so an open
 * panel stays stable when filters lag behind status transitions (e.g. save draft
 * on a returned item moves it to Draft while the Returned filter is still active).
 */
export function resolveSelectedTaskItem(
  items: MockTaskItem[],
  filteredItems: MockTaskItem[],
  selectedItemId: string,
): MockTaskItem | null {
  if (selectedItemId) {
    const selectedInFilter = filteredItems.find((item) => item.id === selectedItemId)
    if (selectedInFilter) {
      return selectedInFilter
    }

    const selectedInAll = items.find((item) => item.id === selectedItemId)
    if (selectedInAll) {
      return selectedInAll
    }
  }

  return filteredItems[0] ?? null
}

/**
 * When an item's status no longer belongs to the active stage filter, return the
 * filter key that owns the new status (or null when no change is needed).
 */
export function resolveStageFilterKeyForItemStatus(
  activeFilterKey: string,
  status: MockTaskItemStatus,
  filterOptions: StageFilterOption[],
): string | null {
  const activeGroup = filterOptions.find((option) => option.key === activeFilterKey)
  if (activeGroup?.statuses.includes(status)) {
    return null
  }

  const owningGroup = filterOptions.find((option) => option.statuses.includes(status))
  return owningGroup?.key ?? null
}

export type TaskItemTransitionAction =
  | "save_draft"
  | "submit_annotation"
  | "submit_judgement"
  | "accept_review"
  | "revise_review"
  | "adjust_review"
  | "reject_review"
  | "escalate_review"

/**
 * Sheet 操作后的最小状态迁移。
 * Week7 先保证「动作后列表可见状态更新」，后续可按真实 API 细化字段变更。
 */
export function applyTaskItemTransition(
  item: MockTaskItem,
  action: TaskItemTransitionAction
): MockTaskItem {
  switch (action) {
    case "save_draft":
      return { ...item, status: TASK_ITEM_STATUS.IN_PROGRESS }
    case "submit_annotation":
    case "submit_judgement":
      return { ...item, status: TASK_ITEM_STATUS.SUBMITTED }
    case "accept_review":
      return { ...item, status: TASK_ITEM_STATUS.APPROVED }
    case "revise_review":
    case "adjust_review":
      return { ...item, status: TASK_ITEM_STATUS.RETURNED }
    case "reject_review":
      return { ...item, status: TASK_ITEM_STATUS.REJECTED }
    case "escalate_review":
      return { ...item, status: TASK_ITEM_STATUS.DISPUTED }
    default:
      return item
  }
}
