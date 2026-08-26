/**
 * Legacy alias — prefer `@/lib/task-stage-kpis` for new code.
 */
import type { TaskSummaryMetric } from "@/components/task-summary-metrics"
import type { MockTaskItem } from "@/lib/domain/task-types"
import { getTaskItemStatusCounts } from "@/lib/task-format"
import {
  buildOverviewDetailMetrics,
  buildOverviewSummaryMetrics,
} from "@/lib/task-stage-kpis"

export type TaskSummaryMode = "summary" | "details"

export function buildTaskItemStatusKpiItems(
  items: MockTaskItem[],
  mode: TaskSummaryMode = "details",
  taskId = "",
): TaskSummaryMetric[] {
  const counts = getTaskItemStatusCounts(items)
  const summary = buildOverviewSummaryMetrics(counts, items.length, taskId || "task")
  if (mode === "summary") {
    return summary
  }
  return [...summary, ...buildOverviewDetailMetrics(counts)]
}

export { detectTaskPhase } from "@/lib/task-stage-kpis"
