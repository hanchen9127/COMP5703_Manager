"use client"

import { useMemo, useState } from "react"

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
import type {
  ActivityEvent,
  MockTask,
  MockTaskItem,
} from "@/lib/mock-data"
import { formatTaskLabel, getTaskItemSignal, getTaskItemValue } from "@/lib/task-format"

type TaskAnnotationWorkspaceProps = {
  task: MockTask
  taskItems: MockTaskItem[]
  activity: ActivityEvent[]
  initialItemId?: string
}

export function TaskAnnotationWorkspace({
  task,
  taskItems,
  activity,
  initialItemId,
}: TaskAnnotationWorkspaceProps) {
  const [selectedItemId, setSelectedItemId] = useState(initialItemId ?? taskItems[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaceTab, setWorkspaceTab] = useState<"details" | "annotate" | "review">("annotate")

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
  const isAiAssisted = task.executionMode === "ai_assisted"
  const isJudgement = task.taskClass === "judgement"
  const taskClassLabel = isJudgement ? "Judgement" : "Annotation"
  const workLabel = isJudgement ? "Judge" : "Annotate"
  const readyForReviewCount = taskItems.filter(
    (item) => item.status === "under_review" || item.status === "finalized"
  ).length
  const candidateCount = taskItems.filter((item) => item.confidence !== "n/a").length
  const batchInFlightCount = taskItems.filter(
    (item) => item.status === "annotation_in_progress"
  ).length
  const batchTimeline = activity.filter(
    (event) =>
      event.actor === "system" ||
      event.actor.startsWith("gpt-") ||
      event.action.includes("dataset") ||
      event.action.includes("candidate")
  )

  return (
    <div className="grid gap-4">
      <TaskSummaryMetrics
        items={[
          { label: "Task items", value: taskItems.length.toString(), iconName: "database-zap" },
          { label: "Task class", value: taskClassLabel, iconName: "tags" },
          { label: "Task type", value: formatTaskLabel(task.taskType), iconName: "pencil-line" },
          {
            label: isAiAssisted ? "Candidate outputs" : "Human-ready items",
            value: (isAiAssisted ? candidateCount : readyForReviewCount).toString(),
            iconName: isAiAssisted ? "circle-check" : "circle-play",
          },
        ]}
        columnsClassName="xl:grid-cols-4"
      />

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
            statusOptions={statusOptions}
          />
          <div className="mt-3">
            <TaskItemTable
              items={filteredTaskItems}
              selectedItemId={selectedItemId}
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
      />
    </div>
  )
}
