import { notFound } from "next/navigation"

import { TaskHistoryBoard } from "@/components/task-history-board"
import { getTaskView } from "@/lib/mock-data"

type PageProps = {
  params: Promise<{
    taskId: string
  }>
}

export default async function TaskHistoryPage({ params }: PageProps) {
  const { taskId } = await params
  const view = getTaskView(taskId)

  if (!view) {
    notFound()
  }

  return <TaskHistoryBoard activity={view.activity} workflow={view.workflow} />
}
