"use client"

import Link from "next/link"
import { useMemo } from "react"
import { ArrowRight, FolderKanban, ListTodo, Scale } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useProjectWorkspace } from "@/components/project-workspace-client-shell"
import { ProjectTaskTable } from "@/components/project-task-table"

export function ProjectTasksReadPanel() {
  const { view, projectId } = useProjectWorkspace()
  const tasks = view.tasks
  const showBackendEmptyState = tasks.length === 0

  const draftTasks = useMemo(
    () => tasks.filter((task) => task.status === "draft").length,
    [tasks],
  )
  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status === "active").length,
    [tasks],
  )
  const backlogCount = useMemo(
    () => tasks.reduce((sum, task) => sum + (task.backlogCount ?? 0), 0),
    [tasks],
  )

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Task count",
            value: tasks.length.toString(),
          },
          {
            label: "Active tasks",
            value: activeTasks.toString(),
          },
          {
            label: "Processing backlog",
            value: backlogCount.toString(),
          },
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

      <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
        <CardHeader className="flex flex-col gap-4 px-4 md:flex-row md:items-start md:justify-between md:px-5">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
              Task portfolio
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
              This is the operating list for creating, continuing, and reviewing tasks inside the project.
            </CardDescription>
          </div>
          <Button asChild className="bg-slate-900 text-stone-100">
            <Link href={`/projects/${projectId}/tasks/new`}>Create task</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          {showBackendEmptyState ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-900/15 bg-stone-50/88 px-6 py-10 text-center">
              <p className="text-base font-semibold text-slate-900">No tasks yet</p>
              <p className="text-[13px] leading-5 text-slate-600">
                Create your first task to start the annotation and review workflow.
              </p>
              <Button asChild className="bg-slate-900 text-stone-100">
                <Link href={`/projects/${projectId}/tasks/new`}>Create task</Link>
              </Button>
            </div>
          ) : (
            <ProjectTaskTable tasks={tasks} />
          )}
        </CardContent>
      </Card>

    </div>
  )
}
