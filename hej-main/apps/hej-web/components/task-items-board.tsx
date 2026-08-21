"use client"

import { useMemo, useState } from "react"
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
import { TaskSummaryMetrics } from "@/components/task-summary-metrics"
import type {
  ActivityEvent,
  MockTask,
  MockTaskItem,
} from "@/lib/mock-data"
import { getTaskItemSignal, getTaskItemValue } from "@/lib/task-format"

type TaskItemsBoardProps = {
  task: MockTask
  taskItems: MockTaskItem[]
  activity: ActivityEvent[]
}

export function TaskItemsBoard({ task, taskItems, activity }: TaskItemsBoardProps) {
  const [selectedItemId, setSelectedItemId] = useState(taskItems[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaceTab, setWorkspaceTab] = useState<"details" | "annotate" | "review">("details")

  const filteredTaskItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return taskItems
    }

    return taskItems.filter(
      (item) =>
        item.id.toLowerCase().includes(normalized) ||
        item.externalRef.toLowerCase().includes(normalized) ||
        item.preview.toLowerCase().includes(normalized) ||
        item.status.toLowerCase().includes(normalized)
    )
  }, [query, taskItems])

  const selectedItem =
    filteredTaskItems.find((taskItem) => taskItem.id === selectedItemId) ??
    taskItems.find((taskItem) => taskItem.id === selectedItemId) ??
    filteredTaskItems[0] ??
    taskItems[0] ??
    null

  const statusOptions = Array.from(new Set(taskItems.map((item) => item.status)))
  const readyCount = taskItems.filter((item) => item.status === "ready").length
  const inProgressCount = taskItems.filter(
    (item) => item.status === "annotation_in_progress"
  ).length
  const reviewCount = taskItems.filter((item) => item.status === "under_review").length
  const finalizedCount = taskItems.filter((item) => item.status === "finalized").length
  const isAiAssisted = task.executionMode === "ai_assisted"
  const isJudgement = task.taskClass === "judgement"
  const workLabel = isJudgement ? "Judge" : "Annotate"

  return (
    <div className="grid gap-4">
      <TaskSummaryMetrics
        items={[
          { label: "Task items", value: taskItems.length.toString(), iconName: "list-todo" },
          { label: "Ready", value: readyCount.toString(), iconName: "circle-check" },
          { label: "In progress", value: inProgressCount.toString(), iconName: "loader-circle" },
          {
            label: isAiAssisted ? "Ready for review" : "Submitted for review",
            value: (reviewCount + finalizedCount).toString(),
            iconName: "circle-play",
          },
        ]}
        columnsClassName="xl:grid-cols-4"
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
            statusOptions={statusOptions}
          />
          <div className="mt-3">
            <TaskItemTable
              items={filteredTaskItems}
              selectedItemId={selectedItemId}
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
              signalLabel={isAiAssisted ? "Confidence" : "Progress"}
              getValue={(item) => getTaskItemValue(task, item)}
              getSignal={(item) => getTaskItemSignal(task, item)}
              actions={[
                {
                  key: "annotate",
                  label: workLabel,
                  onClick: () => {
                    setWorkspaceTab("annotate")
                    setWorkspaceOpen(true)
                  },
                },
                {
                  key: "review",
                  label: "Review",
                  onClick: () => {
                    setWorkspaceTab("review")
                    setWorkspaceOpen(true)
                  },
                },
                {
                  key: "dispute",
                  label: "Dispute",
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

      <TaskItemWorkspaceSheet
        task={task}
        item={selectedItem}
        activity={activity}
        open={workspaceOpen}
        initialTab={workspaceTab}
        onOpenChange={setWorkspaceOpen}
      />
    </div>
  )
}
