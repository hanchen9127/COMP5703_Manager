"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  ArrowRight,
  FolderKanban,
  FolderPlus,
  History,
  ListTodo,
  Scale,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useProjectWorkspace } from "@/components/project-workspace-client-shell"
import { formatTaskClassLabel, formatTaskLabel } from "@/lib/task-format"

export function ProjectWorkspaceOverview() {
  const { view } = useProjectWorkspace()
  const { project, tasks, disputes, exports } = view

  const draftTasks = tasks.filter((task) => task.status === "draft")
  const activeTasks = tasks.filter((task) => task.status === "active")
  const backlogCount = tasks.reduce((sum, task) => sum + (task.backlogCount ?? 0), 0)
  const primaryTask = useMemo(
    () => draftTasks[0] ?? activeTasks[0] ?? tasks[0] ?? null,
    [activeTasks, draftTasks, tasks],
  )
  const portfolioSnapshot = useMemo(() => tasks.slice(0, 3), [tasks])
  const hasMoreTasksThanSnapshot = tasks.length > portfolioSnapshot.length

  const executionSurfaces = [
    {
      title: "Create new task",
      text: "Define a new task profile under this project to begin the annotation and review workflow.",
      href: `/projects/${project.id}/tasks/new`,
      icon: FolderPlus,
    },
    ...(primaryTask
      ? [
          {
            title: "Task setup",
            text: "Configure schema, pointer registration, and review rules while the task is still in draft.",
            href: `/tasks/${primaryTask.id}/setup`,
            icon: FolderKanban,
          },
          {
            title: "Items",
            text: "Inspect task items entering execution and confirm the task is ready for annotation or review.",
            href: `/tasks/${primaryTask.id}/items`,
            icon: ListTodo,
          },
          {
            title: "Task review",
            text: "Use the review desk where candidate judgments are accepted, edited, rejected, or escalated.",
            href: `/tasks/${primaryTask.id}/review`,
            icon: Scale,
          },
          {
            title: "Task history",
            text: "Inspect append-preserving activity and workflow lineage for provenance-sensitive work.",
            href: `/tasks/${primaryTask.id}/history`,
            icon: History,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Tasks", value: tasks.length.toString() },
          { label: "Active tasks", value: activeTasks.length.toString() },
          { label: "Draft tasks", value: draftTasks.length.toString() },
          { label: "Processing backlog", value: backlogCount.toString() },
        ].map(({ label, value }) => (
          <Card
            key={label}
            className="hej-surface-dark rounded-[1.1rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10"
          >
            <CardContent className="px-4 py-3 md:px-5">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium tracking-tight text-slate-600">
                  {label}
                </CardTitle>
                <p className="text-2xl font-semibold text-slate-950">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Task portfolio snapshot
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
              This section shows a compact preview of tasks, not the full list. Open the task portfolio below to see every task in the project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            {portfolioSnapshot.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-900/15 bg-stone-50/88 px-6 py-10 text-center dark:border-white/10">
                <div className="rounded-lg bg-slate-900 p-2.5 text-stone-100">
                  <FolderPlus className="size-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">No tasks yet</p>
                  <p className="mt-1 text-[13px] leading-5 text-slate-600">
                    Create your first task to start the annotation and review workflow.
                  </p>
                </div>
                <Button asChild className="bg-slate-900 text-stone-100">
                  <Link href={`/projects/${project.id}/tasks/new`}>
                    <FolderPlus />
                    Create task
                  </Link>
                </Button>
              </div>
            ) : null}
            {portfolioSnapshot.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className={
                  primaryTask?.id === task.id
                    ? "block rounded-xl border border-amber-300/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(250,244,230,0.92))] p-3.5 shadow-[0_12px_24px_rgba(217,119,6,0.10)] transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-[0_16px_28px_rgba(217,119,6,0.14)]"
                    : "hej-surface-soft block rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-900/20 hover:bg-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/10"
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-slate-900">{task.title}</p>
                  {primaryTask?.id === task.id ? (
                    <Badge variant="outline">lead</Badge>
                  ) : null}
                  <Badge variant="outline">{task.status}</Badge>
                  <Badge variant="outline">
                    {formatTaskClassLabel(task.taskClass)}
                  </Badge>
                  <Badge variant="outline">{formatTaskLabel(task.taskType)}</Badge>
                  <Badge className="bg-amber-300 text-slate-950">{task.executionMode}</Badge>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-slate-600">
                  {task.judgmentQuestion}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Type</span>
                    <span className="font-semibold text-slate-950">
                      {formatTaskLabel(task.taskType)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Policy</span>
                    <span className="font-semibold text-slate-950">{task.reviewPolicyRef}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Backlog</span>
                    <span className="font-semibold text-slate-950">{task.backlogCount ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <span className="font-medium">Open task overview</span>
                    <ArrowRight className="size-4" />
                  </div>
                </div>
              </Link>
            ))}
            {hasMoreTasksThanSnapshot ? (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-900/15 bg-stone-50/88 px-4 py-3 text-sm text-slate-600 dark:border-white/10">
                <span>
                  Previewing {portfolioSnapshot.length} of {tasks.length} tasks here. This is a snapshot only; the full list lives in Task portfolio.
                </span>
                <Button asChild variant="outline" className="border-slate-900/15 bg-white/70 text-slate-900">
                  <Link href={`/projects/${project.id}/tasks`}>
                    View all tasks
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Project side surfaces
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
              These stay in project scope because they cut across tasks or express governance ownership.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            {[
              {
                label: "Disputes",
                detail: `${disputes.length} active cross-task escalations remain visible here.`,
                href: `/projects/${project.id}/disputes`,
              },
              {
                label: "Exports",
                detail: `${exports.length} draft task export package${exports.length === 1 ? "" : "s"} are staged here. Full project export readiness is tracked separately.`,
                href: `/projects/${project.id}/exports`,
              },
              {
                label: "Policies",
                detail: "Policy visibility stays at project scope so task setup remains governed but not overloaded.",
                href: `/projects/${project.id}/policies`,
              },
            ].map(({ label, detail, href }) => (
              <Link
                key={label}
                href={href}
                className="hej-surface-soft block rounded-xl border border-slate-900/10 bg-white/84 p-3.5 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-900/20 hover:bg-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{label}</p>
                    <p className="mt-1 text-[13px] leading-5 text-slate-600">{detail}</p>
                  </div>
                  <ArrowRight className="size-4 text-slate-500" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Next actions
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
              Project overview should push operators toward task execution first, then into the side governance surfaces when needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 md:px-5 sm:grid-cols-2">
            {executionSurfaces.map(({ title, text, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-900/20 hover:bg-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                    <Icon className="size-3.5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-slate-600">{text}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-900">
                  Open
                  <ArrowRight className="size-4" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Workspace guidance
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
              Use the preview for a quick glance, then open Task portfolio for the authoritative full list of tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            {[
              "Use Tasks as the main operating list for creating or continuing work.",
              "Use Disputes and Exports when the question is cross-task governance rather than item execution.",
              "Use Policies to inspect the rules shaping review, escalation, and delivery.",
            ].map((item) => (
              <div
                key={item}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 text-[13px] leading-5 text-slate-700 dark:border-white/10 dark:text-slate-300"
              >
                {item}
              </div>
            ))}
            <Button asChild className="w-full justify-between bg-slate-900 text-stone-100">
              <Link href={`/projects/${project.id}/tasks`}>
                Open task portfolio
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
