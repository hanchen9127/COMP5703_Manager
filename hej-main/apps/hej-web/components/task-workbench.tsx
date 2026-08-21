"use client"

import { useMemo, useState } from "react"
import { Clock3, FileWarning, UserRound } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { HistoryDrawer } from "@/components/history-drawer"
import { TaskItemWorkspaceSheet } from "@/components/task-item-workspace-sheet"
import { TaskFilters } from "@/components/task-filters"
import { TaskItemTable } from "@/components/task-item-table"
import { getTaskItemSignal, getTaskItemValue } from "@/lib/task-format"
import type {
  ActivityEvent,
  MockTask,
  MockTaskItem,
  TaskAssignment,
  WorkflowStep,
} from "@/lib/mock-data"

type TaskWorkbenchProps = {
  task: MockTask
  taskItems: MockTaskItem[]
  workflow: WorkflowStep[]
  assignments: TaskAssignment[]
  activity: ActivityEvent[]
}

export function TaskWorkbench({
  task,
  taskItems,
  workflow,
  assignments,
  activity,
}: TaskWorkbenchProps) {
  const [selectedItemId, setSelectedItemId] = useState(taskItems[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [workspaceTab, setWorkspaceTab] = useState<"details" | "annotate" | "review">("review")

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
    taskItems[0]

  if (!selectedItem) {
    return null
  }

  const statusOptions = Array.from(new Set(taskItems.map((item) => item.status)))
  const isAiAssisted = task.executionMode === "ai_assisted"
  const modeLabel = isAiAssisted ? "AI-assisted" : "Human-first"
  const workLabel = task.taskClass === "judgement" ? "Judge" : "Annotate"

  return (
    <>
      <div className="grid min-w-0 gap-4">
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
              statusOptions={statusOptions}
            />
            <div className="mt-3">
              <TaskItemTable
                items={filteredTaskItems}
                selectedItemId={selectedItem.id}
              onSelect={setSelectedItemId}
              onItemActivate={() => {
                setWorkspaceTab("review")
                setWorkspaceOpen(true)
              }}
              valueLabel={isAiAssisted ? "AI candidate" : "Annotated output"}
              signalLabel={isAiAssisted ? "Confidence" : "Progress"}
              modeLabel={modeLabel}
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
              {activity.slice(0, 4).map((event) => (
                <div
                  key={`${event.time}-${event.action}`}
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
      />
      <HistoryDrawer events={activity} />
    </>
  )
}
