"use client"

/**
 * Review 路由 — 工作台（TaskWorkbench）
 *
 * 与 TaskAnnotationWorkspace 的边界：
 * - Annotate：首遍产出 / 判断，偏「干活」；可带 ModelRunDrawer 等 AI-assisted 辅助。
 * - Review（本组件）：偏「治理、复审、分配、活动追溯」，UI 信息架构不同。
 *
 * 仍复用 TaskFilters / TaskItemTable / TaskItemWorkspaceSheet，以便条目列表交互一致；侧栏卡片组合不同。
 */
import { useEffect, useMemo, useState } from "react"
import { useTaskAuditFeed } from "@/hooks/use-task-audit-feed"
import { useTaskItemWorkspaceSync } from "@/hooks/use-task-item-workspace-sync"
import { mapTaskHistoryToActivityEvents } from "@/lib/map-task-history-events"
import { useRouter } from "next/navigation"
import { Clock3, FileWarning, UserRound } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { HistoryDrawerWithLiveData } from "@/components/history-drawer-with-live-data"
import { useTaskWorkspace } from "@/components/task-workspace-client-shell"
import { TaskWorkspaceResolvedPolicy } from "@/components/task-workspace-resolved-policy"
import { TaskItemWorkspaceSheet } from "@/components/task-item-workspace-sheet"
import { TaskFilters } from "@/components/task-filters"
import { TaskItemTable } from "@/components/task-item-table"
import { TaskSummaryMetrics } from "@/components/task-summary-metrics"
import { listDraftsForTaskItem } from "@/lib/api/task-items"
import {
  getScopeStatuses,
  getTaskItemSignal,
  getTaskItemValue,
  resolveSelectedTaskItem,
  resolveStageFilterKeyForItemStatus,
  REVIEW_PAGE_FILTERS,
} from "@/lib/task-format"
import { buildReviewHeaderMetrics } from "@/lib/task-stage-kpis"

import { applyApiDraftsToMockItem } from "@/lib/task-workspace-data"
import type {
  MockTask,
  MockTaskItem,
  TaskAssignment,
  WorkflowStep,
} from "@/lib/domain/task-types"
import type { ActivityEvent } from "@/lib/domain/admin-types"

type TaskWorkbenchProps = {
  task: MockTask
  taskItems: MockTaskItem[]
  workflow: WorkflowStep[]
  assignments: TaskAssignment[]
  activity: ActivityEvent[]
  initialItemId?: string
}

/**
 * Review tab — uses the same hydrated task workspace view as Overview/Items/Annotate.
 * Enriches task items with per-item drafts for the review work panel.
 */
export function TaskWorkbenchWithRealData({
  initialItemId,
}: {
  initialItemId?: string
} = {}) {
  const { view, taskId } = useTaskWorkspace()
  const { task, taskItems, workflow, assignments } = view
  const auditFeed = useTaskAuditFeed(taskId, { limit: 8 })
  const activity = useMemo(
    () => mapTaskHistoryToActivityEvents(auditFeed.events),
    [auditFeed.events],
  )
  const [items, setItems] = useState<MockTaskItem[]>(taskItems)

  useEffect(() => {
    setItems(taskItems)
  }, [taskItems])

  useEffect(() => {
    if (taskItems.length === 0) {
      return
    }

    let cancelled = false

    void (async () => {
      const enriched = await Promise.all(
        taskItems.map(async (item) => {
          const draftResult = await listDraftsForTaskItem(item.id)
          if (!draftResult.ok) {
            return item
          }
          return applyApiDraftsToMockItem(item, draftResult.data.drafts, task.taskType)
        }),
      )

      if (!cancelled) {
        setItems(enriched)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [task.taskType, taskItems])

  return (
    <TaskWorkbench
      task={task}
      taskItems={items}
      workflow={workflow}
      assignments={assignments}
      activity={activity}
      initialItemId={initialItemId}
    />
  )
}

export function TaskWorkbench({
  task,
  taskItems,
  workflow,
  assignments,
  activity,
  initialItemId,
}: TaskWorkbenchProps) {
  const router = useRouter()
  const { syncItemUpdated, syncActionComplete } = useTaskItemWorkspaceSync()
  const scopeStatuses = useMemo(() => getScopeStatuses(REVIEW_PAGE_FILTERS), [])
  const [items, setItems] = useState(taskItems)
  const [activeFilter, setActiveFilter] = useState<string>("submitted")
  const [selectedItemId, setSelectedItemId] = useState(
    initialItemId ?? taskItems[0]?.id ?? "",
  )
  const [query, setQuery] = useState("")
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaceTab, setWorkspaceTab] = useState<"details" | "annotate" | "review">("review")

  useEffect(() => {
    setItems(taskItems)
  }, [taskItems])

  useEffect(() => {
    if (!initialItemId) return
    setSelectedItemId(initialItemId)
    const target = items.find((item) => item.id === initialItemId)
    if (target?.status === "disputed") {
      setActiveFilter("disputed")
    }
  }, [initialItemId, items])

  const activeReviewGroup = useMemo(
    () => REVIEW_PAGE_FILTERS.find((entry) => entry.key === activeFilter),
    [activeFilter],
  )

  const scopedItems = useMemo(() => {
    const inReviewScope = items.filter((item) => scopeStatuses.has(item.status))
    if (!activeReviewGroup) {
      return inReviewScope
    }
    const allowed = new Set(activeReviewGroup.statuses)
    return inReviewScope.filter((item) => allowed.has(item.status))
  }, [items, scopeStatuses, activeReviewGroup])

  const reviewHeaderMetrics = useMemo(
    () => buildReviewHeaderMetrics(task.id, items),
    [task.id, items],
  )

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

  const reviewTableEmptyMessage = useMemo(() => {
    if (scopedItems.length === 0) {
      return "No Submitted or Disputed items to review."
    }
    if (query.trim() && filteredTaskItems.length === 0) {
      return `No items match "${query.trim()}" in the review scope (Submitted / Disputed).`
    }
    return undefined
  }, [scopedItems.length, query, filteredTaskItems.length])

  const isAiAssisted = task.executionMode === "ai_assisted"
  const modeLabel = isAiAssisted ? "AI-assisted" : "Human-first"

  return (
    <>
      <div className="grid min-w-0 gap-4">
        <TaskSummaryMetrics
          items={reviewHeaderMetrics}
          narrative="Open submitted items for sign-off; disputed items may need escalation on the Dispute tab."
          columnsClassName="grid-cols-2 sm:grid-cols-3"
          activeFilterKey={activeFilter}
          onMetricClick={(metric) => {
            if (metric.filterKey) {
              setActiveFilter(metric.filterKey)
            }
          }}
        />

        <TaskWorkspaceResolvedPolicy compact className="mb-3" />

        <Card className="hej-surface-dark min-w-0 rounded-[1.25rem] border-slate-900/10 bg-white/76 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Review desk
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
              {isAiAssisted
                ? "Review starts after AI candidates are generated. Inspect the candidate output, make a human decision, and escalate only when ambiguity remains."
                : "Review starts after human annotation is submitted. Inspect the first-pass output, confirm the result, and escalate only when conflict remains."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-5">
            <TaskFilters
              query={query}
              onQueryChange={setQuery}
              activeCount={filteredTaskItems.length}
              filterOptions={REVIEW_PAGE_FILTERS}
              activeFilter={activeFilter}
              onFilterChange={(key) => setActiveFilter(key ?? "submitted")}
              showAll={false}
            />
            <div className="mt-3">
              <TaskItemTable
                items={filteredTaskItems}
                selectedItemId={selectedItem?.id ?? selectedItemId}
                emptyMessage={reviewTableEmptyMessage}
              onSelect={setSelectedItemId}
              onItemActivate={() => {
                setWorkspaceTab("review")
                setWorkspaceOpen(true)
              }}
              valueLabel={isAiAssisted ? "AI candidate" : "Annotated output"}
              signalLabel={isAiAssisted ? "Confidence" : undefined}
              modeLabel={modeLabel}
              getValue={(item) => getTaskItemValue(task, item)}
              getSignal={isAiAssisted ? (item) => getTaskItemSignal(task, item) : undefined}
              actions={[
                {
                  key: "review",
                  label: "Review",
                  onClick: () => {
                    setWorkspaceTab("review")
                    setWorkspaceOpen(true)
                  },
                },
              ]}
            />
          </div>
        </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/76 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
                Execution owners
              </CardTitle>
              <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
                Task-level ownership stays visible here instead of living inside the item console.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 md:px-5">
              {assignments.map((assignment) => (
                <div
                  key={`${assignment.reviewer}-${assignment.role}`}
                  className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                      <UserRound className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{assignment.reviewer}</p>
                      <p className="text-xs text-slate-500">{assignment.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[13px] text-slate-600">
                    <span>{assignment.workstream}</span>
                    <span className="font-medium text-slate-900">{assignment.sla}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/76 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
                Workflow progress
              </CardTitle>
              <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
                Review remains downstream from annotation and stays visible at task scope.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 md:px-5">
              {workflow.map((step) => (
                <div
                  key={step.title}
                  className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                    <Badge variant="outline">{step.state}</Badge>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-slate-600">{step.description}</p>
                </div>
              ))}
              <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-amber-50/80 p-3.5 text-[13px] leading-5 text-slate-700 dark:border-white/10 dark:text-slate-300">
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  <FileWarning className="size-3.5" />
                  Governance note
                </div>
                Review and dispute remain explicit after annotation instead of overwriting outcomes silently.
              </div>
            </CardContent>
          </Card>

          <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/76 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
                Recent activity
              </CardTitle>
              <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
                Task-level events stay outside the work panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 md:px-5">
              {activity.slice(0, 4).map((event, idx) => (
                <div
                  key={`${idx}-${event.time}-${event.action}`}
                  className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-amber-100 p-2 text-slate-900">
                        <Clock3 className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                        <p className="text-xs text-slate-500">{event.actor}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-500">{event.time}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-slate-600">{event.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <TaskItemWorkspaceSheet
        task={task}
        item={selectedItem}
        activity={activity}
        open={workspaceOpen}
        initialTab={workspaceTab}
        onOpenChange={setWorkspaceOpen}
        onItemUpdated={(updatedItem) => {
          syncItemUpdated(updatedItem, setItems)
          setSelectedItemId(updatedItem.id)

          const nextFilter = resolveStageFilterKeyForItemStatus(
            activeFilter,
            updatedItem.status,
            REVIEW_PAGE_FILTERS,
          )
          if (nextFilter) {
            setActiveFilter(nextFilter)
          }
        }}
        onActionComplete={({ itemId, transitionAction }) => {
          if (transitionAction === "reject_review") {
            syncActionComplete({ taskId: task.id, itemId, transitionAction })
            return
          }
          syncActionComplete({ taskId: task.id, itemId, transitionAction })
        }}
      />
      <HistoryDrawerWithLiveData taskId={task.id} />
    </>
  )
}
