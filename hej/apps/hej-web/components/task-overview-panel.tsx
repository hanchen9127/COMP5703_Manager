"use client"

/**
 * 任务 Overview 页 — 主内容区（客户端组件）
 *
 * 页面结构（自上而下）：
 * 1) TaskSummaryMetrics：条目总数 + 六种 item 状态各一张卡（与 Items 页共用 buildTaskItemStatusKpiItems）。
 * 2) 双栏：左「Task home」= 任务是什么、目标、数据源、规则；右「Next actions」= 深链到 setup/items/annotate/review/history。
 * 3) TaskSidePanels：由 TaskOverviewPanelWithRealData 在下方渲染（执行人、工作流进度）。
 *
 * 数据：均由父级传入（task / taskItems / workflow / assignments），本组件不做请求。
 */
import { useMemo } from "react"
import Link from "next/link"
import { ArrowRight, ChevronRight, FileCog, History, ListTodo, PlayCircle, Scale } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { TaskSummaryMetrics } from "@/components/task-summary-metrics"

import {
  formatTaskClassLabel,
  formatTaskLabel,
  formatTaskStatusLabel,
  getTaskItemStatusCounts,
} from "@/lib/task-format"
import {
  buildOverviewDetailMetrics,
  buildOverviewLifecycleSegments,
  buildOverviewNarrative,
  buildOverviewSummaryMetrics,
  computeDistributionMajority,
  detectTaskPhase,
} from "@/lib/task-stage-kpis"
import { TaskStatusDistributionPanel } from "@/components/task-status-distribution-panel"
import type {
  MockTask,
  MockTaskItem,
  TaskAssignment,
  WorkflowStep,
} from "@/lib/domain/task-types"

type TaskPhase = "annotation" | "review" | "dispute" | "final"

const TASK_PHASES: { key: TaskPhase; label: string }[] = [
  { key: "annotation", label: "Annotation" },
  { key: "review", label: "Review" },
  { key: "dispute", label: "Dispute" },
  { key: "final", label: "Final" },
]

type CompletionStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

type TaskOverviewPanelProps = {
  task: MockTask
  taskItems: MockTaskItem[]
  workflow: WorkflowStep[]
  assignments: TaskAssignment[]
  finalizedCount: number
  totalCount: number
  canCompleteTask: boolean
  completionStatus: CompletionStatus
  onCompleteTask?: () => Promise<void>
}

export function TaskOverviewPanel({
  task,
  taskItems,
  workflow,
  assignments,
  finalizedCount,
  totalCount,
  canCompleteTask,
  completionStatus,
  onCompleteTask,
}: TaskOverviewPanelProps) {
  const itemCounts = getTaskItemStatusCounts(taskItems)
  const currentPhase = useMemo(
    () => detectTaskPhase(itemCounts, taskItems.length),
    [itemCounts, taskItems.length],
  )
  const overviewNarrative = useMemo(
    () => buildOverviewNarrative(itemCounts, taskItems.length, currentPhase),
    [itemCounts, taskItems.length, currentPhase],
  )
  const lifecycleSegments = useMemo(
    () => buildOverviewLifecycleSegments(itemCounts),
    [itemCounts],
  )
  const approvedCount = itemCounts.approved ?? 0
  const executionLabel = task.executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"
  const taskClassLabel = formatTaskClassLabel(task.taskClass)
  const workLabel = task.taskClass === "judgement" ? "Judge" : "Annotate"
  const isTaskCompleted = String(task.status) === "completed"
  const completedLabel = `${finalizedCount}/${totalCount} finalized`

  // 右侧「下一步」卡片：纯导航用途，href 必须与本任务的 task.id 一致
  const nextActions = [
    {
      title: "Setup",
      text: "View definition, register data pointers, and confirm launch readiness.",
      href: `/tasks/${task.id}/setup`,
      icon: FileCog,
    },
    {
      title: "Items",
      text: "Inspect task details and the state of every task item before entering work.",
      href: `/tasks/${task.id}/items`,
      icon: ListTodo,
    },
    {
      title: workLabel,
      text:
        task.taskClass === "judgement"
          ? "Open the judgement desk for first-pass verdicts."
          : "Open the annotation desk for first-pass outputs.",
      href: `/tasks/${task.id}/annotate`,
      icon: PlayCircle,
    },
    {
      title: "Review",
      text: "Move into governance once outputs are ready.",
      href: `/tasks/${task.id}/review`,
      icon: Scale,
    },
    {
      title: "History",
      text: "Inspect activity, lineage, and provenance-sensitive events.",
      href: `/tasks/${task.id}/history`,
      icon: History,
    },
  ]

  return (
    <div className="space-y-4">
      <section aria-label="Item status summary">
        <TaskSummaryMetrics
          items={buildOverviewSummaryMetrics(itemCounts, taskItems.length, task.id)}
          detailItems={buildOverviewDetailMetrics(itemCounts)}
          narrative={overviewNarrative}
          columnsClassName="grid-cols-2 sm:grid-cols-4"
          expandable
        />
      </section>

      <section aria-label="Task phase pipeline">
        <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
          <CardContent className="px-4 py-4 md:px-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Task phase pipeline
            </p>
            <div className="flex items-center gap-1">
              {TASK_PHASES.map((phase, index) => {
                const phaseIndex = TASK_PHASES.findIndex((p) => p.key === currentPhase)
                const isActive = phase.key === currentPhase
                const isCompleted = index < phaseIndex
                const phaseCount =
                  phase.key === "annotation"
                    ? itemCounts.unstarted + itemCounts.inProgress
                    : phase.key === "review"
                      ? itemCounts.submitted + itemCounts.returned + itemCounts.rejected
                      : phase.key === "dispute"
                        ? itemCounts.disputed
                        : itemCounts.approved

                return (
                  <div key={phase.key} className="flex items-center gap-1">
                    <div
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-slate-900 text-stone-100"
                          : isCompleted
                            ? "bg-slate-200 text-slate-700 dark:bg-white/20 dark:text-slate-200"
                            : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
                      }`}
                      title={`${phaseCount} item(s) in this stage group`}
                    >
                      {phase.label}
                      {phaseCount > 0 ? (
                        <span className="ml-1.5 tabular-nums opacity-80">({phaseCount})</span>
                      ) : null}
                    </div>
                    {index < TASK_PHASES.length - 1 && (
                      <ChevronRight className="size-4 shrink-0 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {taskItems.length > 0 ? (
        <TaskStatusDistributionPanel
          title="Item lifecycle"
          description="Full-task breakdown — open Annotate, Review, or Items to work each group."
          segments={lifecycleSegments}
          total={taskItems.length}
          majority={computeDistributionMajority(lifecycleSegments)}
          gridSegments={lifecycleSegments}
          showZeroInGrid
        />
      ) : null}

      {/* 第二行：左「任务说明书」+ 右「去干活」入口；大屏双列，小屏自动堆叠 */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Task home
            </CardTitle>
            <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
              Overview should explain what this task is, how it runs, and what the next operational step is.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 md:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{formatTaskStatusLabel(task.status)}</Badge>
              <Badge variant="outline">{taskClassLabel}</Badge>
              <Badge variant="outline">{formatTaskLabel(task.taskType)}</Badge>
              <Badge className="bg-amber-300 text-slate-950">{executionLabel}</Badge>
              <Badge variant="outline">{completedLabel}</Badge>
            </div>

            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-4 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Task objective</p>
              <p className="mt-2 text-sm leading-6 text-slate-800">{task.judgmentQuestion}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] leading-6 text-slate-600">
                Complete only when all items are finalized/exportable.
              </p>
            </div>

            {isTaskCompleted ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>
                <p className="text-[13px] leading-6 text-slate-600">Task completed.</p>
              </div>
            ) : null}
            {!isTaskCompleted ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canCompleteTask || completionStatus.kind === "loading"}
                    onClick={() => {
                      if (!onCompleteTask) return
                      void onCompleteTask()
                    }}
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {completionStatus.kind === "loading" ? "Completing..." : "Complete task"}
                  </button>
                </div>

                {completionStatus.kind === "success" ? (
                  <p className="text-[13px] font-medium text-emerald-700">{completionStatus.message}</p>
                ) : completionStatus.kind === "error" ? (
                  <p className="text-[13px] font-medium text-red-700">{completionStatus.message}</p>
                ) : !canCompleteTask ? (
                  <p className="text-[13px] leading-6 text-slate-600">
                    All items must be finalized before this task can be completed.
                  </p>
                ) : null}
              </>
            ) : null}

            <p className="text-[13px] leading-6 text-slate-600">
              Full definition, policy resolution, and data registration live on{" "}
              <Link
                href={`/tasks/${task.id}/setup`}
                className="font-medium text-slate-900 underline-offset-2 hover:underline"
              >
                Setup
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Next actions
            </CardTitle>
            <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
              Move from task home into setup, item flow, first-pass work, review, or history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            {nextActions.map(({ title, text, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="hej-surface-soft block rounded-xl border border-slate-900/10 bg-white/84 p-3.5 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-900/20 hover:bg-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-[13px] leading-5 text-slate-600">{text}</p>
                  </div>
                  <ArrowRight className="size-4 text-slate-500" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

    </div>
  )
}
