import { notFound } from "next/navigation"

import { TaskAnnotationWorkspace } from "@/components/task-annotation-workspace"
import { getTaskView } from "@/lib/mock-data"

type PageProps = {
  params: Promise<{
    taskId: string
  }>
  searchParams: Promise<{
    item?: string
  }>
}

export default async function TaskAnnotatePage({
  params,
  searchParams,
}: PageProps) {
  const { taskId } = await params
  const { item } = await searchParams
  const view = getTaskView(taskId)

  if (!view) {
    notFound()
  }

  return (
    <TaskAnnotationWorkspace
      task={view.task}
      taskItems={view.taskItems}
      activity={view.activity}
      initialItemId={item}
    />
  )
}
