import { notFound } from "next/navigation"
import { Bot, DatabaseZap, FolderPlus } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { TaskCreateForm } from "@/components/task-create-form"
import { getProjectWorkspaceView } from "@/lib/project-data"

type PageProps = {
  params: Promise<{
    projectId: string
  }>
}

export default async function NewTaskPage({ params }: PageProps) {
  const { projectId } = await params
  const view = await getProjectWorkspaceView(projectId)

  if (!view) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Task creation"
        title="Create a task"
        description="Projects are task containers. Choose the task class, pick the concrete task type, connect storage-backed data, select AI-assisted or human-first execution, write shared rules, and launch the task before review and dispute begin."
        badges={[
          { label: "new task", tone: "outline" },
          { label: view.project.name, tone: "accent" },
          { label: "annotation first", tone: "dark" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Existing tasks",
            value: view.tasks.length.toString(),
            icon: FolderPlus,
          },
          {
            label: "Task classes",
            value: "annotation + judgement",
            icon: DatabaseZap,
          },
          {
            label: "Available modes",
            value: "AI-assisted + human-first",
            icon: Bot,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="hej-surface-dark flex items-center justify-between rounded-[1.1rem] border border-slate-900/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10"
          >
            <div>
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
            </div>
            <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
              <Icon className="size-3.5" />
            </div>
          </div>
        ))}
      </section>

      <TaskCreateForm project={view.project} />
    </div>
  )
}
