import { notFound } from "next/navigation"

import { TaskOverviewPanel } from "@/components/task-overview-panel"
import { getTaskView } from "@/lib/mock-data"

type PageProps = {
  params: Promise<{
    taskId: string
  }>
}

export default async function TaskPage({ params }: PageProps) {
  const { taskId } = await params
  const view = getTaskView(taskId)

  if (!view) {
    notFound()
  }

  return (
    <TaskOverviewPanel
      task={view.task}
      taskItems={view.taskItems}
      workflow={view.workflow}
      assignments={view.assignments}
      activity={view.activity}
    />
  )
}
