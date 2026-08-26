/**
 * Route: /tasks/[taskId]/history
 *
 * Live audit activity + derived workflow lineage (split GET endpoints).
 */
import { TaskHistoryReadPanel } from "@/components/task-history-read-panel"
import { TaskWorkspacePage } from "@/components/task-workspace-shell"

type PageProps = {
  params: Promise<{
    taskId: string
  }>
}

export default function TaskHistoryPage(_props: PageProps) {
  return (
    <TaskWorkspacePage>
      <TaskHistoryReadPanel />
    </TaskWorkspacePage>
  )
}
