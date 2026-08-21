import { notFound } from "next/navigation"

import { TaskItemsBoard } from "@/components/task-items-board"
import { getTaskView } from "@/lib/mock-data"

type PageProps = {
  params: Promise<{
    taskId: string
  }>
}

export default async function TaskItemsPage({ params }: PageProps) {
  const { taskId } = await params
  const view = getTaskView(taskId)

  if (!view) {
    notFound()
  }

  return (
    <TaskItemsBoard
      task={view.task}
      taskItems={view.taskItems}
      activity={view.activity}
    />
  )
}
