import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, FolderKanban, ListTodo, Scale } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ProjectTaskTable } from "@/components/project-task-table"
import { getProjectWorkspaceView } from "@/lib/project-data"

type PageProps = {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectTasksPage({ params }: PageProps) {
  const { projectId } = await params
  const view = await getProjectWorkspaceView(projectId)

  if (!view) {
    notFound()
  }

  const draftTasks = view.tasks.filter((task) => task.status === "draft").length
  const activeTasks = view.tasks.filter((task) => task.status === "active").length
  const backlogCount = view.tasks.reduce((sum, task) => sum + (task.backlogCount ?? 0), 0)

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Draft tasks",
            value: draftTasks.toString(),
            icon: FolderKanban,
          },
          {
            label: "Active tasks",
            value: activeTasks.toString(),
            icon: Scale,
          },
          {
            label: "Open task items",
            value: backlogCount.toString(),
            icon: ListTodo,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="hej-surface-dark gap-3 rounded-[1.1rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10"
          >
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-4 md:px-5">
              <p className="text-3xl font-semibold text-slate-950">{value}</p>
              <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                <Icon className="size-3.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Tasks
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
            This is the primary project-level operating list. From here, users should either create a new task profile or continue an existing task into setup, items, execution desks, review, or history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 md:px-5">
          <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 text-[13px] leading-5 text-slate-700 dark:border-white/10 dark:text-slate-300">
            Create means profiling the task as a governed program. Continue means entering the correct execution surface for work already in progress.
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-slate-900 text-stone-100">
              <Link href={`/projects/${projectId}/tasks/new`}>
                Create task
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild className="bg-slate-900 text-stone-100">
              <Link href={`/projects/${projectId}`}>
                Return to overview
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/projects/${projectId}/policies`}>Open policies</Link>
            </Button>
          </div>
          <ProjectTaskTable tasks={view.tasks} />
        </CardContent>
      </Card>
    </div>
  )
}
