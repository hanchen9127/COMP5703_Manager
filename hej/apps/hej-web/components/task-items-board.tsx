"use client"

/**
 * Items 页 — 主面板（客户端，状态较多）
 *
 * 本地 state：
 * - selectedItemId：表格高亮行；打开 Sheet 时与当前编辑对象一致。
 * - query：搜索关键字，驱动 filteredTaskItems（useMemo 避免每次渲染全表 filter）。
 * - workspaceOpen / workspaceTab：控制 TaskItemWorkspaceSheet 是否打开及默认 Tab。
 *
 * B2 相关：
 * - statusValues：从全量 taskItems 收集出现过的 status → sortTaskItemStatuses 固定顺序 → 传给 TaskFilters 做图例。
 * - 指标卡：`buildTaskItemStatusKpiItems`，与 Overview 共用同一套计数与标签（B2）。
 *
 * 表格列「值/信号」：judgement vs annotation 由 getTaskItemValue / getTaskItemSignal 统一决定，避免列组件分支爆炸。
 */
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { TaskFilters } from "@/components/task-filters"
import { TaskItemTable } from "@/components/task-item-table"
import { TaskItemWorkspaceSheet } from "@/components/task-item-workspace-sheet"
import { TaskStageFilterChips } from "@/components/task-stage-filter-chips"

import { useTaskItemWorkspaceSync } from "@/hooks/use-task-item-workspace-sync"
import { buildItemsFilterChips } from "@/lib/task-stage-kpis"
import {
  getTaskItemSignal,
  getTaskItemValue,
  ITEMS_PAGE_FILTERS,
  resolveSelectedTaskItem,
  resolveStageFilterKeyForItemStatus,
} from "@/lib/task-format"
import type { StageFilterOption } from "@/lib/task-format"
import type { MockTask, MockTaskItem } from "@/lib/domain/task-types"
import type { ActivityEvent } from "@/lib/domain/admin-types"

type TaskItemsBoardProps = {
  task: MockTask
  taskItems: MockTaskItem[]
  activity: ActivityEvent[]
}

export function TaskItemsBoard({ task, taskItems, activity }: TaskItemsBoardProps) {
  const router = useRouter()
  const { syncItemUpdated, syncActionComplete } = useTaskItemWorkspaceSync()
  const [items, setItems] = useState(taskItems)
  const [selectedItemId, setSelectedItemId] = useState(taskItems[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaceTab, setWorkspaceTab] = useState<"details" | "annotate" | "review">("details")

  useEffect(() => {
    setItems(taskItems)
  }, [taskItems])

  const activeGroup: StageFilterOption | undefined = activeFilter
    ? ITEMS_PAGE_FILTERS.find((f) => f.key === activeFilter)
    : undefined

  const filteredTaskItems = useMemo(() => {
    let result = items
    if (activeGroup) {
      const allowed = new Set(activeGroup.statuses)
      result = result.filter((item) => allowed.has(item.status))
    }
    const normalized = query.trim().toLowerCase()
    if (!normalized) return result
    return result.filter(
      (item) =>
        item.id.toLowerCase().includes(normalized) ||
        item.externalRef.toLowerCase().includes(normalized) ||
        item.preview.toLowerCase().includes(normalized) ||
        item.status.toLowerCase().includes(normalized)
    )
  }, [items, query, activeGroup])

  const selectedItem =
    resolveSelectedTaskItem(items, filteredTaskItems, selectedItemId) ??
    items[0] ??
    null

  const itemsTableEmptyMessage = useMemo(() => {
    if (items.length === 0) {
      return "This task has no items yet."
    }
    if (query.trim() && filteredTaskItems.length === 0) {
      return `No items match "${query.trim()}" in the current view.`
    }
    if (activeGroup && filteredTaskItems.length === 0) {
      return `No items in the "${activeGroup.label}" lifecycle group. Try another filter or clear filters.`
    }
    return undefined
  }, [items.length, activeGroup, filteredTaskItems.length, query])

  const isAiAssisted = task.executionMode === "ai_assisted"
  const isJudgement = task.taskClass === "judgement"
  const workLabel = isJudgement ? "Judge" : "Annotate"
  const inventoryChips = useMemo(() => buildItemsFilterChips(items), [items])

  return (
    <div className="grid gap-4">
      <TaskStageFilterChips
        chips={inventoryChips}
        activeKey={activeFilter}
        onChange={setActiveFilter}
      />

      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Items
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            {isAiAssisted
              ? isJudgement
                ? "Inspect task items, runtime state, and background AI judgement. Open any item into the work panel for detail and action."
                : "Inspect task items, runtime state, and background AI annotation. Open any item into the work panel for detail and action."
              : "Inspect task items and execution state. Open any item into the work panel for first-pass work and downstream review."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <TaskFilters
            query={query}
            onQueryChange={setQuery}
            activeCount={filteredTaskItems.length}
            filterOptions={ITEMS_PAGE_FILTERS}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            showAll
          />
          <div className="mt-3">
            <TaskItemTable
              items={filteredTaskItems}
              selectedItemId={selectedItem?.id ?? selectedItemId}
              emptyMessage={itemsTableEmptyMessage}
              onSelect={setSelectedItemId}
              onItemActivate={() => {
                setWorkspaceTab("details")
                setWorkspaceOpen(true)
              }}
              valueLabel={
                isAiAssisted
                  ? isJudgement
                    ? "AI verdict"
                    : "AI candidate"
                  : isJudgement
                    ? "Current verdict"
                    : "Current output"
              }
              signalLabel={isAiAssisted ? "Confidence" : undefined}
              getValue={(item) => getTaskItemValue(task, item)}
              getSignal={isAiAssisted ? (item) => getTaskItemSignal(task, item) : undefined}
              getActions={(item) => {
                switch (item.status) {
                  case "unstarted":
                  case "in_progress":
                  case "rejected":
                  case "returned":
                    return [{
                      key: "annotate",
                      label: workLabel,
                      onClick: () => { setWorkspaceTab("annotate"); setWorkspaceOpen(true) },
                    }]
                  case "submitted":
                    return [{
                      key: "review",
                      label: "Review",
                      onClick: () => { setWorkspaceTab("review"); setWorkspaceOpen(true) },
                    }]
                  case "approved":
                  case "disputed":
                    return [{
                      key: "details",
                      label: "Details",
                      onClick: () => { setWorkspaceTab("details"); setWorkspaceOpen(true) },
                    }]
                  default:
                    return []
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

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

          if (!activeFilter) return
          const nextFilter = resolveStageFilterKeyForItemStatus(
            activeFilter,
            updatedItem.status,
            ITEMS_PAGE_FILTERS,
          )
          if (nextFilter) {
            setActiveFilter(nextFilter)
          }
        }}
        onActionComplete={({ itemId, transitionAction }) => {
          if (
            transitionAction === "submit_annotation" ||
            transitionAction === "submit_judgement"
          ) {
            router.push(`/tasks/${task.id}/review?item=${itemId}`)
            return
          }
          syncActionComplete({ taskId: task.id, itemId, transitionAction })
        }}
      />
    </div>
  )
}
