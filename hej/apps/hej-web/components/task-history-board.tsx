"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowRight, Clock3, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import type {
  HistoryCategory,
  TaskHistoryEvent,
  TaskWorkflowLineageResponse,
  WorkflowStep,
} from "@/lib/api/task-history"
import { formatApiDatetimeLocal } from "@/lib/format-api-datetime"
import { formatWorkflowStepStateLabel } from "@/lib/task-format"

type CategoryOption = { value: HistoryCategory | "all"; label: string }

type TaskHistoryBoardProps = {
  taskId: string
  logs: TaskHistoryEvent[] | null
  totalCount: number
  loadedCount: number
  hasMore: boolean
  loadingMore: boolean
  lineage: TaskWorkflowLineageResponse | null
  auditLoading: boolean
  workflowLoading: boolean
  auditError: string | null
  workflowError: string | null
  category: HistoryCategory | "all"
  workflowStepKey: string | null
  categoryOptions: CategoryOption[]
  onCategoryChange: (value: HistoryCategory | "all") => void
  onWorkflowStepSelect: (stepKey: string) => void
  onLoadMore: () => void
  onRefresh: () => void
}

const DATA_INTAKE_OPERATIONS = new Set(["dataset_registered", "files_uploaded"])
const DEFAULT_VISIBLE_LOGS = 8

function formatHistoryResourceLine(
  resource: TaskHistoryEvent["resource"],
  event: Pick<TaskHistoryEvent, "operation" | "detail">,
): string | null {
  if (!resource) return null
  const label = resource.label?.trim()
  if (resource.type === "task_item" && label) {
    if (event.detail?.trim() === label) {
      return null
    }
    if (DATA_INTAKE_OPERATIONS.has(event.operation)) {
      return label
    }
    return `Item: ${label}`
  }
  return `${resource.type}: ${resource.id}`
}

function stepStateBadgeVariant(state: WorkflowStep["state"]): "default" | "outline" | "destructive" {
  if (state === "blocked") return "destructive"
  if (state === "in_progress") return "default"
  return "outline"
}

export function TaskHistoryBoard({
  taskId,
  logs,
  totalCount,
  loadedCount,
  hasMore,
  loadingMore,
  lineage,
  auditLoading,
  workflowLoading,
  auditError,
  workflowError,
  category,
  workflowStepKey,
  categoryOptions,
  onCategoryChange,
  onWorkflowStepSelect,
  onLoadMore,
  onRefresh,
}: TaskHistoryBoardProps) {
  const [visibleLogs, setVisibleLogs] = useState(DEFAULT_VISIBLE_LOGS)
  const activeStep = lineage?.steps.find((step) => step.key === workflowStepKey)
  const logsToShow = useMemo(() => logs?.slice(0, visibleLogs) ?? [], [logs, visibleLogs])
  const hiddenCount = Math.max((logs?.length ?? 0) - logsToShow.length, 0)
  const canShowMore = hiddenCount > 0
  const visibleCount = logsToShow.length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-slate-600">
          Use workflow posture to see where the task stands, then click a step to filter related
          activity on the left.
        </p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-1.5 size-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
                  Activity history
                </CardTitle>
                <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
                  Launch, annotation, review, dispute, and policy events recorded for this task.
                  {totalCount > 0 ? ` (${totalCount} total` : ""}
                  {workflowStepKey && activeStep ? ` · showing ${visibleCount} for ${activeStep.title}` : ""}
                  {totalCount > 0 ? ")" : ""}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categoryOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={category === option.value && !workflowStepKey ? "default" : "outline"}
                    className={category === option.value && !workflowStepKey ? "bg-slate-950 text-stone-100" : "hej-surface-soft"}
                    onClick={() => onCategoryChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            <p className="rounded-lg border border-slate-900/10 bg-stone-50/90 px-3 py-2 text-[12px] leading-5 text-slate-600">
              Audit events are recorded from when logging was enabled for this task. Earlier actions are not backfilled automatically.
            </p>
            {auditLoading ? (
              <p className="text-sm text-slate-600">Loading activity…</p>
            ) : auditError ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {auditError}
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-900/15 bg-stone-50/80 p-8 text-center">
                <p className="text-sm font-medium text-slate-900">{workflowStepKey ? "No activity for this step" : "No activity yet"}</p>
                <p className="mt-1 text-[13px] text-slate-600">
                  {workflowStepKey
                    ? "Try another workflow step or clear the filter to see all events."
                    : "Create the task, register data on Setup, submit work, or run review actions to populate history."}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {logsToShow.map((event) => {
                    const resourceLine = formatHistoryResourceLine(event.resource, event)
                    return (
                      <div key={event.id} className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-amber-100 p-2 text-slate-900">
                              {event.actor.kind === "system" ? <ShieldCheck className="size-3.5" /> : <Clock3 className="size-3.5" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{event.summary}</p>
                              <p className="text-xs text-slate-500">{event.actor.display_name} · {event.category}</p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            <time dateTime={event.occurred_at}>{formatApiDatetimeLocal(event.occurred_at)}</time>
                          </Badge>
                        </div>
                        {event.detail ? (
                          <p className={cn("mt-2 text-[13px] leading-5 text-slate-600", DATA_INTAKE_OPERATIONS.has(event.operation) && "font-medium text-slate-800")}>
                            {event.detail}
                          </p>
                        ) : null}
                        {resourceLine ? <p className="mt-1 text-xs text-slate-500">{resourceLine}</p> : null}
                        {event.changes.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-xs text-slate-600">
                            {event.changes.map((change) => (
                              <li key={change.field}>
                                <span className="font-medium text-slate-800">{change.field}</span>: {String(change.before ?? "—")} → {String(change.after ?? "—")}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
                {canShowMore ? (
                  <div className="flex justify-center pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setVisibleLogs((count) => count + DEFAULT_VISIBLE_LOGS)}>
                      <ArrowDown className="mr-1.5 size-3.5" />
                      Show {Math.min(DEFAULT_VISIBLE_LOGS, hiddenCount)} more
                    </Button>
                  </div>
                ) : null}
                {loadedCount < totalCount ? (
                  <p className="text-center text-xs text-slate-500">
                    Loaded {loadedCount} of {totalCount} events
                    {workflowStepKey ? ` (${visibleCount} match this step)` : ""}.
                  </p>
                ) : null}
                {hasMore ? (
                  <div className="flex justify-center pt-1">
                    <Button type="button" variant="outline" size="sm" disabled={loadingMore} onClick={onLoadMore}>
                      {loadingMore ? "Loading more…" : "Load more activity"}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">Workflow posture</CardTitle>
            <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
              One active stage at a time — click a step to filter related activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            {workflowLoading ? (
              <p className="text-sm text-slate-600">Loading workflow…</p>
            ) : workflowError ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{workflowError}</div>
            ) : !lineage || lineage.steps.length === 0 ? (
              <p className="text-sm text-slate-600">No workflow steps available.</p>
            ) : (
              <>
                <div className="rounded-xl border border-slate-900/12 bg-white/90 p-3.5">
                  <p className="text-sm font-semibold text-slate-900">{lineage.headline ?? "Task workflow"}</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{lineage.next_action ?? "Select a step below to filter related activity."}</p>
                  {lineage.current_step_key ? (
                    <Button asChild size="sm" className="mt-3 bg-slate-900 text-stone-100">
                      <Link href={`/tasks/${taskId}/${lineage.steps.find((s) => s.key === lineage.current_step_key)?.workspace_tab ?? ""}`}>
                        Go to workspace
                        <ArrowRight className="ml-1.5 size-3.5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="mt-3">
                      <Link href={`/tasks/${taskId}/finalized`}>
                        View finalized
                        <ArrowRight className="ml-1.5 size-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>

                {lineage.steps.map((step, index) => {
                  const isSelected = workflowStepKey === step.key
                  const isCurrent = lineage.current_step_key === step.key
                  const tab = step.workspace_tab

                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => onWorkflowStepSelect(step.key)}
                      className={cn(
                        "hej-surface-soft flex w-full gap-3 rounded-xl border p-3.5 text-left transition-colors dark:border-white/10",
                        isSelected ? "border-slate-900/25 bg-amber-50/90 ring-1 ring-slate-900/10" : "border-slate-900/10 bg-white/84 hover:border-slate-900/18 hover:bg-stone-50/95",
                        step.state === "later" && "opacity-70",
                      )}
                    >
                      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", step.state === "complete" ? "bg-emerald-700 text-stone-100" : step.state === "blocked" ? "bg-red-800 text-stone-100" : isCurrent ? "bg-slate-900 text-stone-100" : "bg-slate-200 text-slate-700")}>
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                          <Badge variant={stepStateBadgeVariant(step.state)}>{formatWorkflowStepStateLabel(step.state)}</Badge>
                          {isCurrent ? <Badge variant="outline" className="border-amber-400 text-amber-900">Current</Badge> : null}
                        </div>
                        <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{step.description}</p>
                        {step.evidence ? <p className="mt-1 text-xs text-slate-500">{step.evidence}</p> : null}
                        {(step.filter_categories ?? []).length > 0 ? (
                          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                            Filter activity: {(step.filter_categories ?? []).join(", ")}
                          </p>
                        ) : null}
                        {tab ? (
                          <span className="mt-2 inline-flex items-center text-xs font-medium text-slate-700" onClick={(event) => event.stopPropagation()}>
                            <Link href={`/tasks/${taskId}/${tab}`} className="inline-flex items-center hover:underline">
                              Open {tab}
                              <ExternalLink className="ml-1 size-3" />
                            </Link>
                          </span>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
