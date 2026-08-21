import { notFound } from "next/navigation"

import { TaskWorkbench } from "@/components/task-workbench"
import { getTaskView } from "@/lib/mock-data"

type PageProps = {
  params: Promise<{
    taskId: string
  }>
}

export default async function TaskReviewPage({ params }: PageProps) {
  const { taskId } = await params
  const view = getTaskView(taskId)

  if (!view) {
    notFound()
  }

  return (
    <TaskWorkbench
      task={view.task}
      taskItems={view.taskItems}
      workflow={view.workflow}
      assignments={view.assignments}
      activity={view.activity}
    />
  )
}
