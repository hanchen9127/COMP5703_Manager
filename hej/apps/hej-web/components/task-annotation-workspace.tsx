"use client"

/**
 * Annotate 路由 — 工作台（TaskAnnotationWorkspace）
 *
 * 典型用户路径：在 Items 页点进某条，或带 ?item= 深链；在本页完成首遍标注/判断后再进入 Review。
 *
 * 指标区会根据 executionMode、taskClass 切换文案（如 Candidate outputs vs Human-ready items）。
 * 条目级状态常量比较（如 ANNOTATION_IN_PROGRESS）使用 TASK_ITEM_STATUS，避免魔法字符串散落（B2）。
 */
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ModelRunDrawer } from "@/components/model-run-drawer"
import { TaskFilters } from "@/components/task-filters"
import { TaskItemTable } from "@/components/task-item-table"
import { TaskItemWorkspaceSheet } from "@/components/task-item-workspace-sheet"
import { TaskSummaryMetrics } from "@/components/task-summary-metrics"
import { TaskStatusDistributionPanel } from "@/components/task-status-distribution-panel"

import {
  ANNOTATE_PAGE_FILTERS,
  getScopeStatuses,
  getTaskItemSignal,
  getTaskItemValue,
  resolveSelectedTaskItem,
  resolveStageFilterKeyForItemStatus,
} from "@/lib/task-format"
import {
  buildAnnotateDistribution,
  buildAnnotateHeaderMetrics,
  formatAnnotateContextLine,
} from "@/lib/task-stage-kpis"
import { useTaskItemWorkspaceSync } from "@/hooks/use-task-item-workspace-sync"
import { TASK_ITEM_STATUS } from "@/lib/domain/task-status"
import type { MockTask, MockTaskItem } from "@/lib/domain/task-types"
import type { ActivityEvent } from "@/lib/domain/admin-types"

function resolveInitialAnnotateFilter(initialFilter?: string): string {
  if (initialFilter === "expert_send_back") {
    return "returned"
  }
  if (initialFilter && ANNOTATE_PAGE_FILTERS.some((option) => option.key === initialFilter)) {
    return initialFilter
  }
  return "draft"
}

type TaskAnnotationWorkspaceProps = {
  task: MockTask
  taskItems: MockTaskItem[]
  activity: ActivityEvent[]
  initialItemId?: string
  initialFilter?: string
}

export function TaskAnnotationWorkspace({
  task,
  taskItems,
  activity,
  initialItemId,
  initialFilter,
}: TaskAnnotationWorkspaceProps) {
  const router = useRouter()
  const { syncItemUpdated, syncActionComplete } = useTaskItemWorkspaceSync()
  const [items, setItems] = useState(taskItems)
  const [activeFilter, setActiveFilter] = useState(() => resolveInitialAnnotateFilter(initialFilter))
  const [selectedItemId, setSelectedItemId] = useState(initialItemId ?? taskItems[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaceTab, setWorkspaceTab] = useState<"details" | "annotate" | "review">("annotate")
  const deepLinkOpenedRef = useRef(false)

  useEffect(() => {
    setItems(taskItems)
  }, [taskItems])

  useEffect(() => {
    if (!initialItemId) return
    const target = taskItems.find((item) => item.id === initialItemId)
    if (!target) return

    setSelectedItemId(initialItemId)
    if (target.status === TASK_ITEM_STATUS.RETURNED) {
      setActiveFilter("returned")
    } else if (target.status === TASK_ITEM_STATUS.REJECTED) {
      setActiveFilter("rejected")
    }
  }, [initialItemId, taskItems])

  useEffect(() => {
    if (!initialItemId || deepLinkOpenedRef.current) return
    const target = items.find((item) => item.id === initialItemId)
    if (!target) return

    deepLinkOpenedRef.current = true
    setSelectedItemId(initialItemId)
    setWorkspaceTab("annotate")
    setWorkspaceOpen(true)
  }, [initialItemId, items])

  const scopedItems = useMemo(() => {
    const option = ANNOTATE_PAGE_FILTERS.find((entry) => entry.key === activeFilter)
    const allowed = option ? new Set(option.statuses) : getScopeStatuses(ANNOTATE_PAGE_FILTERS)
    return items.filter((item) => allowed.has(item.status))
  }, [items, activeFilter])

  const filteredTaskItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return scopedItems
    return scopedItems.filter(
      (item) =>
        item.id.toLowerCase().includes(normalized) ||
        item.externalRef.toLowerCase().includes(normalized) ||
        item.preview.toLowerCase().includes(normalized) ||
        item.status.toLowerCase().includes(normalized)
    )
  }, [scopedItems, query])

  const selectedItem = useMemo(
    () => resolveSelectedTaskItem(items, filteredTaskItems, selectedItemId),
    [filteredTaskItems, items, selectedItemId],
  )

  const handleItemUpdated = (updatedItem: MockTaskItem) => {
    syncItemUpdated(updatedItem, setItems)
    setSelectedItemId(updatedItem.id)

    const nextFilter = resolveStageFilterKeyForItemStatus(
      activeFilter,
      updatedItem.status,
      ANNOTATE_PAGE_FILTERS,
    )
    if (nextFilter) {
      setActiveFilter(nextFilter)
    }
  }

  const annotateTableEmptyMessage = useMemo(() => {
    const stageLabel =
      ANNOTATE_PAGE_FILTERS.find((entry) => entry.key === activeFilter)?.label ?? "matching"
    if (scopedItems.length === 0) {
      return `No ${stageLabel} items available for annotation.`
    }
    if (query.trim() && filteredTaskItems.length === 0) {
      return `No ${stageLabel} items match "${query.trim()}".`
    }
    return undefined
  }, [activeFilter, scopedItems.length, query, filteredTaskItems.length])

  const isAiAssisted = task.executionMode === "ai_assisted"
  const isJudgement = task.taskClass === "judgement"
  const isUnsupportedTaskType =
    task.taskType !== "image" && task.taskType !== "text" && task.taskType !== "audio"
  const taskClassLabel = isJudgement ? "Judgement" : "Annotation"
  const workLabel = isJudgement ? "Judge" : "Annotate"
  const readyForReviewCount = items.filter(
    (item) =>
      item.status === TASK_ITEM_STATUS.SUBMITTED ||
      item.status === TASK_ITEM_STATUS.APPROVED
  ).length
  const candidateCount = items.filter((item) => item.confidence !== "n/a").length
  const batchInFlightCount = items.filter(
    (item) => item.status === TASK_ITEM_STATUS.IN_PROGRESS
  ).length
  const batchTimeline = activity.filter(
    (event) =>
      event.actor === "system" ||
      event.actor.startsWith("gpt-") ||
      event.action.includes("dataset") ||
      event.action.includes("candidate")
  )
  const annotateDistribution = useMemo(() => buildAnnotateDistribution(items), [items])
  const annotateHeaderMetrics = useMemo(
    () => buildAnnotateHeaderMetrics(task, items),
    [task, items],
  )
  const annotateContextLine = formatAnnotateContextLine(task)

  const handleDistributionClick = (segment: { filterKey?: string }) => {
    if (segment.filterKey) {
      setActiveFilter(segment.filterKey)
    }
  }

  return (
    <div className="grid gap-4">
      <TaskSummaryMetrics
        items={annotateHeaderMetrics}
        narrative={annotateContextLine}
        columnsClassName="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
        activeFilterKey={activeFilter}
        onMetricClick={(metric) => {
          if (metric.filterKey) {
            setActiveFilter(metric.filterKey)
          }
        }}
      />
      {isUnsupportedTaskType ? (
        <Card className="hej-surface-dark rounded-[1.25rem] border-amber-200 bg-amber-50/80">
          <CardContent className="px-4 py-4 text-sm text-amber-900">
            Unsupported task type: {task.taskType}
          </CardContent>
        </Card>
      ) : null}

      {isUnsupportedTaskType ? null : (
        <>
      <TaskStatusDistributionPanel
        title="Annotate queue"
        description="Full breakdown for this task. Select a queue group (Draft, Returned, Rejected) to filter the table below."
        segments={annotateDistribution.distributionSegments}
        total={annotateDistribution.total}
        majority={annotateDistribution.majority}
        gridSegments={annotateDistribution.distributionSegments}
        showZeroInGrid
        activeFilterKey={activeFilter}
        onSegmentClick={handleDistributionClick}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href={`/tasks/${task.id}/review`}
              className="text-[13px] font-medium text-slate-800 underline-offset-2 hover:underline dark:text-slate-200"
            >
              Open Review
            </Link>
          </div>
        }
      />

      </>
      )}

      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10 dark:shadow-[0_12px_30px_rgba(2,6,23,0.28)]">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Items
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            {isAiAssisted
              ? isJudgement
                ? "Inspect item status and candidate verdicts. Open any item into the work panel for first-pass judgement and downstream review."
                : "Inspect item status and candidate outputs. Open any item into the work panel for first-pass annotation and downstream review."
              : isJudgement
                ? "Human judgement happens item by item. Open any item into the work panel to produce the first-pass verdict and rationale."
                : "Human annotation happens item by item. Open any item into the work panel to produce the first-pass output."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <TaskFilters
            query={query}
            onQueryChange={setQuery}
            activeCount={filteredTaskItems.length}
            filterOptions={ANNOTATE_PAGE_FILTERS}
            activeFilter={activeFilter}
            onFilterChange={(key) => setActiveFilter(key ?? "draft")}
            showAll={false}
          />
          <div className="mt-3">
            <TaskItemTable
              items={filteredTaskItems}
              selectedItemId={selectedItem?.id ?? selectedItemId}
              emptyMessage={annotateTableEmptyMessage}
              onSelect={setSelectedItemId}
              onItemActivate={() => {
                setWorkspaceTab("annotate")
                setWorkspaceOpen(true)
              }}
              valueLabel={
                isAiAssisted
                  ? isJudgement
                    ? "AI verdict"
                    : "AI candidate"
                  : isJudgement
                    ? "Draft verdict"
                    : "Draft output"
              }
              signalLabel={isAiAssisted ? "Confidence" : undefined}
              getValue={(item) => getTaskItemValue(task, item)}
              getSignal={isAiAssisted ? (item) => getTaskItemSignal(task, item) : undefined}
              actions={[
                {
                  key: "annotate",
                  label: workLabel,
                  onClick: () => {
                    setWorkspaceTab("annotate")
                    setWorkspaceOpen(true)
                  },
                },
              ]}
            />
          </div>
          </CardContent>
      </Card>

      {isAiAssisted ? (
        <ModelRunDrawer
          taskType={task.taskType}
          isJudgement={isJudgement}
          batchInFlightCount={batchInFlightCount}
          candidateCount={candidateCount}
          readyForReviewCount={readyForReviewCount}
          batchTimeline={batchTimeline}
        />
      ) : null}

      <TaskItemWorkspaceSheet
        task={task}
        item={selectedItem}
        activity={activity}
        open={workspaceOpen}
        initialTab={workspaceTab}
        onOpenChange={setWorkspaceOpen}
        onItemUpdated={handleItemUpdated}
        onActionComplete={({ itemId, transitionAction }) => {
          const skipRefresh =
            transitionAction === "submit_annotation" ||
            transitionAction === "submit_judgement"
          syncActionComplete(
            { taskId: task.id, itemId, transitionAction },
            { skipRefresh },
          )
        }}
      />
    </div>
  )
}
