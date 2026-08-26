/**
 * Route: /tasks/[taskId]/finalized
 *
 * Task-level finalized items desk (canonicalized rows).
 */
import { TaskFinalizedDesk } from "@/components/task-finalized-desk"
import { TaskWorkspacePage } from "@/components/task-workspace-shell"

type PageProps = {
  params: Promise<{
    taskId: string
  }>
}

export default async function TaskFinalizedPage({ params }: PageProps) {
  const { taskId } = await params

  return (
    <TaskWorkspacePage>
      <TaskFinalizedDesk taskId={taskId} />
    </TaskWorkspacePage>
  )
}
