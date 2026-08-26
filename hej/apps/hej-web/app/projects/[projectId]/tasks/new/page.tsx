import { notFound } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { TaskCreateForm, type InitialTextSpanLabelOptions } from "@/components/task-create-form"
import {
  buildBackendBridgeProjectView,
  getProjectWorkspaceView,
} from "@/lib/project-data"

type PageProps = {
  params: Promise<{
    projectId: string
  }>
}

export default async function NewTaskPage({ params }: PageProps) {
  const { projectId } = await params
  const view = (await getProjectWorkspaceView(projectId)) ?? buildBackendBridgeProjectView(projectId)

  if (!view) {
    notFound()
  }

  const initialTextSpanLabelOptions: InitialTextSpanLabelOptions = {}
  for (const task of view.tasks) {
    if (task.textSpanLabelOptions?.length) {
      initialTextSpanLabelOptions[task.taskClass] ??= task.textSpanLabelOptions
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Task creation"
        title="Create a task"
        description="Projects are task containers. Choose the task class, pick the concrete task type, connect storage-backed data, select AI-assisted or human-first execution, write shared rules, and launch the task before review and dispute begin."
        badges={[{ label: view.project.name, tone: "accent" }]}
      />

      <TaskCreateForm
        project={view.project}
        initialTextSpanLabelOptions={initialTextSpanLabelOptions}
      />
    </div>
  )
}
