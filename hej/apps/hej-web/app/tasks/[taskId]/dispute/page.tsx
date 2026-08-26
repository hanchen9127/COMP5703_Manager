/**
 * Route: /tasks/[taskId]/dispute
 *
 * Task-level dispute desk: lists open escalations from the backend and
 * lets a reviewer / expert close each one with a decision. Pure client
 * data (token-bearing requests), so no server-side mock fallback —
 * absent token / missing data render as the empty state in
 * {@link TaskDisputeDesk}.
 */
import { TaskDisputeDesk } from "@/components/task-dispute-desk"
import { TaskWorkspacePage } from "@/components/task-workspace-shell"

type PageProps = {
  params: Promise<{
    taskId: string
  }>
}

export default async function TaskDisputePage({ params }: PageProps) {
  const { taskId } = await params

  return (
    <TaskWorkspacePage>
      <TaskDisputeDesk taskId={taskId} />
    </TaskWorkspacePage>
  )
}
