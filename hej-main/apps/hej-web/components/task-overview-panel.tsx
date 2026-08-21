"use client"

import Link from "next/link"
import { ArrowRight, FileCog, History, ListTodo, PlayCircle, Scale } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { TaskSummaryMetrics } from "@/components/task-summary-metrics"
import type {
  ActivityEvent,
  MockTask,
  MockTaskItem,
  TaskAssignment,
  WorkflowStep,
} from "@/lib/mock-data"
import { formatTaskClassLabel, formatTaskLabel } from "@/lib/task-format"

type TaskOverviewPanelProps = {
  task: MockTask
  taskItems: MockTaskItem[]
  workflow: WorkflowStep[]
  assignments: TaskAssignment[]
  activity: ActivityEvent[]
}

export function TaskOverviewPanel({
  task,
  taskItems,
  workflow,
  assignments,
  activity,
}: TaskOverviewPanelProps) {
  const readyCount = taskItems.filter((item) => item.status === "ready").length
  const inProgressCount = taskItems.filter(
    (item) => item.status === "annotation_in_progress"
  ).length
  const reviewCount = taskItems.filter((item) => item.status === "under_review").length
  const executionLabel = task.executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"
  const taskClassLabel = formatTaskClassLabel(task.taskClass)
  const workLabel = task.taskClass === "judgement" ? "Judge" : "Annotate"

  const nextActions = [
    {
      title: "Setup",
      text: "Adjust task definition, rules, schema, and launch settings.",
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
      <TaskSummaryMetrics
        items={[
          { label: "Task items", value: taskItems.length.toString(), iconName: "list-todo" },
          { label: "Ready", value: readyCount.toString(), iconName: "circle-check" },
          { label: "In progress", value: inProgressCount.toString(), iconName: "loader-circle" },
          { label: "In review", value: reviewCount.toString(), iconName: "scale" },
        ]}
        columnsClassName="md:grid-cols-4"
      />

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
              <Badge variant="outline">{task.status}</Badge>
              <Badge variant="outline">{taskClassLabel}</Badge>
              <Badge variant="outline">{formatTaskLabel(task.taskType)}</Badge>
              <Badge className="bg-amber-300 text-slate-950">{executionLabel}</Badge>
            </div>

            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-4 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Task objective</p>
              <p className="mt-2 text-sm leading-6 text-slate-800">{task.judgmentQuestion}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Data source
                </p>
                <p className="mt-2 break-all text-sm font-medium text-slate-900">
                  {task.dataSourceLabel}
                </p>
              </div>
              <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Current policy
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">{task.reviewPolicyRef}</p>
              </div>
            </div>

            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Shared rules
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-700">{task.annotationRules}</p>
            </div>
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
                className="hej-surface-soft block rounded-xl border border-slate-900/10 bg-white/84 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900/20 hover:bg-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/10"
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Workflow progression
            </CardTitle>
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
          </CardContent>
        </Card>

        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Operator context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Assigned roles
              </p>
              <div className="mt-3 space-y-2">
                {assignments.slice(0, 2).map((assignment) => (
                  <div key={`${assignment.reviewer}-${assignment.role}`} className="text-sm">
                    <p className="font-medium text-slate-900">{assignment.reviewer}</p>
                    <p className="text-[13px] leading-5 text-slate-600">
                      {assignment.role} · {assignment.workstream} · {assignment.sla}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Recent activity
              </p>
              <div className="mt-3 space-y-2">
                {activity.slice(0, 3).map((event) => (
                  <div key={`${event.time}-${event.action}-overview`} className="text-sm">
                    <p className="font-medium text-slate-900">{event.action}</p>
                    <p className="text-[13px] leading-5 text-slate-600">{event.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
