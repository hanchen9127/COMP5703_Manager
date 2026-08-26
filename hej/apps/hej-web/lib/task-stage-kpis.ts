/**
 * Stage-scoped KPI builders: each task tab answers one operator question.
 */
import type { TaskSummaryMetric } from "@/components/task-summary-metrics"

import { TASK_ITEM_STATUS } from "@/lib/domain/task-status"
import type { MockTask, MockTaskItem } from "@/lib/domain/task-types"
import {
  ANNOTATE_PAGE_FILTERS,
  formatTaskClassLabel,
  formatTaskItemStatusLabel,
  formatTaskLabel,
  getTaskItemStatusCounts,
  ITEMS_PAGE_FILTERS,
  REVIEW_PAGE_FILTERS,
  type StageFilterOption,
  type TaskItemStatusCounts,
} from "@/lib/task-format"
import { statusVisualFor, type StatusVisualSegment } from "@/lib/task-status-visual"

export type StageMetric = TaskSummaryMetric & {
  key: string
  filterKey?: string | null
  href?: string
  hint?: string
}

export type TaskPhase = "annotation" | "review" | "dispute" | "final"

export function detectTaskPhase(counts: TaskItemStatusCounts, total: number): TaskPhase {
  if (total === 0) return "annotation"
  if (counts.disputed > 0) return "dispute"
  if (counts.approved === total) return "final"
  if (
    counts.submitted > 0 ||
    counts.returned > 0 ||
    counts.approved > 0 ||
    counts.rejected > 0
  ) {
    return "review"
  }
  return "annotation"
}

export function countForStageFilter(items: MockTaskItem[], filter: StageFilterOption): number {
  const allowed = new Set(filter.statuses)
  return items.filter((item) => allowed.has(item.status)).length
}

function n(value: number): string {
  return String(value)
}

export function buildOverviewNarrative(
  counts: TaskItemStatusCounts,
  total: number,
  phase: TaskPhase,
): string {
  if (total === 0) {
    return "No items yet — register data on Setup, then open Items to inspect the queue."
  }

  const parts: string[] = []
  const inDraft = counts.unstarted + counts.inProgress
  if (inDraft > 0) parts.push(`${inDraft} in draft`)
  if (counts.submitted > 0) parts.push(`${counts.submitted} awaiting review`)
  if (counts.returned > 0) parts.push(`${counts.returned} returned to annotators`)
  if (counts.rejected > 0) parts.push(`${counts.rejected} rejected`)
  if (counts.disputed > 0) parts.push(`${counts.disputed} in dispute`)
  if (counts.approved > 0) parts.push(`${counts.approved} approved`)

  const phaseHint =
    phase === "dispute"
      ? "Current focus: Dispute"
      : phase === "final"
        ? "Current focus: Finalized / export"
        : phase === "review"
          ? "Current focus: Review"
          : "Current focus: Annotation"

  return parts.length > 0 ? `${parts.join(" · ")} — ${phaseHint}` : phaseHint
}

export function buildOverviewSummaryMetrics(
  counts: TaskItemStatusCounts,
  total: number,
  taskId: string,
): StageMetric[] {
  const inDraft = counts.unstarted + counts.inProgress
  const needsAttention =
    counts.submitted + counts.returned + counts.rejected + counts.disputed

  return [
    {
      key: "total",
      label: "Total items",
      value: n(total),
      iconName: "list-todo",
      hint: "All items registered for this task",
    },
    {
      key: "in-draft",
      label: "In draft",
      value: n(inDraft),
      iconName: "loader-circle",
      href: `/tasks/${taskId}/annotate`,
      hint: "Not started or in progress — open the annotate desk",
    },
    {
      key: "approved",
      label: "Approved",
      value: n(counts.approved),
      iconName: "file-check",
      href: `/tasks/${taskId}/finalized`,
      hint: "Items that passed review and are export-ready",
    },
    {
      key: "needs-attention",
      label: "Needs attention",
      value: n(needsAttention),
      iconName: "alert-triangle",
      href: `/tasks/${taskId}/review`,
      hint: "Submitted, returned, rejected, or disputed — review, dispute, and annotate desks",
    },
  ]
}

export function buildOverviewDetailMetrics(counts: TaskItemStatusCounts): StageMetric[] {
  return [
    {
      key: "unstarted",
      label: formatTaskItemStatusLabel(TASK_ITEM_STATUS.UNSTARTED),
      value: n(counts.unstarted),
      iconName: "circle-check",
    },
    {
      key: "in-progress",
      label: formatTaskItemStatusLabel(TASK_ITEM_STATUS.IN_PROGRESS),
      value: n(counts.inProgress),
      iconName: "loader-circle",
    },
    {
      key: "submitted",
      label: formatTaskItemStatusLabel(TASK_ITEM_STATUS.SUBMITTED),
      value: n(counts.submitted),
      iconName: "circle-play",
    },
    {
      key: "returned",
      label: formatTaskItemStatusLabel(TASK_ITEM_STATUS.RETURNED),
      value: n(counts.returned),
      iconName: "rotate-ccw",
    },
    {
      key: "approved-detail",
      label: formatTaskItemStatusLabel(TASK_ITEM_STATUS.APPROVED),
      value: n(counts.approved),
      iconName: "file-check",
    },
    {
      key: "rejected",
      label: formatTaskItemStatusLabel(TASK_ITEM_STATUS.REJECTED),
      value: n(counts.rejected),
      iconName: "circle-x",
    },
    {
      key: "disputed",
      label: formatTaskItemStatusLabel(TASK_ITEM_STATUS.DISPUTED),
      value: n(counts.disputed),
      iconName: "alert-triangle",
    },
  ]
}

export type ItemsFilterChip = {
  key: string | null
  label: string
  count: number
}

export function buildItemsFilterChips(items: MockTaskItem[]): ItemsFilterChip[] {
  const chips: ItemsFilterChip[] = [
    { key: null, label: "All", count: items.length },
    ...ITEMS_PAGE_FILTERS.map((filter) => ({
      key: filter.key,
      label: filter.label,
      count: countForStageFilter(items, filter),
    })),
  ]
  return chips
}

export function buildAnnotateHeaderMetrics(
  task: MockTask,
  items: MockTaskItem[],
): StageMetric[] {
  const counts = getTaskItemStatusCounts(items)
  const toAnnotate = counts.unstarted + counts.inProgress
  const taskId = task.id

  return [
    {
      key: "to-annotate",
      label: "To annotate",
      value: n(toAnnotate),
      iconName: "loader-circle",
      filterKey: "draft",
      hint: "Draft queue — open and complete first-pass work",
    },
    {
      key: "returned",
      label: "Returned",
      value: n(counts.returned),
      iconName: "rotate-ccw",
      filterKey: "returned",
      hint: "Sent back from review for revision",
    },
    {
      key: "rejected",
      label: "Rejected",
      value: n(counts.rejected),
      iconName: "circle-x",
      filterKey: "rejected",
      hint: "Rejected items that need a new pass",
    },
    {
      key: "in-review",
      label: "In review",
      value: n(counts.submitted),
      iconName: "circle-play",
      href: `/tasks/${taskId}/review`,
      hint: "Already submitted — continue on the Review tab",
    },
  ]
}

/** Largest non-zero segment for distribution headers; null when empty or all zero. */
export function computeDistributionMajority(
  segments: StatusVisualSegment[],
): StatusVisualSegment | null {
  const withCounts = segments.filter((entry) => entry.count > 0)
  if (withCounts.length === 0) {
    return null
  }
  return withCounts.reduce((largest, entry) =>
    entry.count > largest.count ? entry : largest,
  )
}

export type AnnotateDistributionBundle = {
  /** Segments for the annotate work queue (matches ANNOTATE_PAGE_FILTERS). */
  queueSegments: StatusVisualSegment[]
  /** Items handed off to review (informational, links to Review). */
  handedToReview: StatusVisualSegment
  /** Approved / disputed — not actionable on Annotate. */
  outOfScopeSegments: StatusVisualSegment[]
  /** Queue + handed + out-of-scope, fixed order for bar and grid. */
  distributionSegments: StatusVisualSegment[]
  majority: StatusVisualSegment | null
  total: number
}

export function buildAnnotateDistribution(items: MockTaskItem[]): AnnotateDistributionBundle {
  const counts = getTaskItemStatusCounts(items)
  const total = items.length

  const queueSegments: StatusVisualSegment[] = ANNOTATE_PAGE_FILTERS.map((filter) => {
    const count = countForStageFilter(items, filter)
    if (filter.key === "draft") {
      return {
        status: TASK_ITEM_STATUS.IN_PROGRESS,
        label: filter.label,
        count,
        barClassName: "bg-sky-500",
        dotClassName: "bg-sky-500",
        filterKey: filter.key,
      }
    }
    const firstStatus = filter.statuses[0]
    if (!firstStatus) {
      return {
        status: filter.key,
        label: filter.label,
        count,
        barClassName: "bg-slate-300",
        dotClassName: "bg-slate-400",
        filterKey: filter.key,
      }
    }
    const segment = statusVisualFor(firstStatus, filter.label, count)
    return { ...segment, filterKey: filter.key }
  })

  const handedToReview = statusVisualFor(
    TASK_ITEM_STATUS.SUBMITTED,
    "Handed to review",
    counts.submitted,
  )

  const outOfScopeStatuses: Array<{ status: typeof TASK_ITEM_STATUS.APPROVED | typeof TASK_ITEM_STATUS.DISPUTED; label: string }> = [
    { status: TASK_ITEM_STATUS.APPROVED, label: formatTaskItemStatusLabel(TASK_ITEM_STATUS.APPROVED) },
    { status: TASK_ITEM_STATUS.DISPUTED, label: formatTaskItemStatusLabel(TASK_ITEM_STATUS.DISPUTED) },
  ]

  const outOfScopeSegments = outOfScopeStatuses.map(({ status, label }) => {
    const count =
      status === TASK_ITEM_STATUS.APPROVED ? counts.approved : counts.disputed
    return statusVisualFor(status, label, count)
  })

  const distributionSegments = [
    ...queueSegments,
    handedToReview,
    ...outOfScopeSegments,
  ]

  return {
    queueSegments,
    handedToReview,
    outOfScopeSegments,
    distributionSegments,
    majority: computeDistributionMajority(distributionSegments),
    total,
  }
}

export function buildReviewHeaderMetrics(
  taskId: string,
  items: MockTaskItem[],
): StageMetric[] {
  const reviewSubmittedFilter = REVIEW_PAGE_FILTERS[0]
  const reviewDisputedFilter = REVIEW_PAGE_FILTERS[1]
  const submitted = reviewSubmittedFilter ? countForStageFilter(items, reviewSubmittedFilter) : 0
  const disputed = reviewDisputedFilter ? countForStageFilter(items, reviewDisputedFilter) : 0
  const returned = items.filter((item) => item.status === TASK_ITEM_STATUS.RETURNED).length

  const metrics: StageMetric[] = [
    {
      key: "submitted",
      label: "Submitted",
      value: n(submitted),
      iconName: "circle-play",
      filterKey: "submitted",
      hint: "Awaiting human review",
    },
    {
      key: "disputed",
      label: "Disputed",
      value: n(disputed),
      iconName: "alert-triangle",
      filterKey: "disputed",
      hint: "Open escalation cases",
    },
  ]

  if (returned > 0) {
    metrics.push({
      key: "returned",
      label: "Returned",
      value: n(returned),
      iconName: "rotate-ccw",
      href: `/tasks/${taskId}/annotate?filter=returned`,
      hint: "Being revised on the Annotate tab",
    })
  }

  return metrics
}

/** Fixed lifecycle segments for Overview distribution (includes zeros). */
export function buildOverviewLifecycleSegments(
  counts: TaskItemStatusCounts,
): StatusVisualSegment[] {
  const draftCount = counts.unstarted + counts.inProgress
  return [
    {
      status: "draft",
      label: "Draft",
      count: draftCount,
      barClassName: "bg-amber-300",
      dotClassName: "bg-amber-300",
    },
    statusVisualFor(TASK_ITEM_STATUS.SUBMITTED, "Submitted", counts.submitted),
    statusVisualFor(TASK_ITEM_STATUS.RETURNED, "Returned", counts.returned),
    statusVisualFor(TASK_ITEM_STATUS.APPROVED, "Approved", counts.approved),
    statusVisualFor(TASK_ITEM_STATUS.REJECTED, "Rejected", counts.rejected),
    statusVisualFor(TASK_ITEM_STATUS.DISPUTED, "Disputed", counts.disputed),
  ]
}

export function formatAnnotateContextLine(task: MockTask): string {
  const mode = task.executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"
  return `${mode} · ${formatTaskClassLabel(task.taskClass)} · ${formatTaskLabel(task.taskType)}`
}
