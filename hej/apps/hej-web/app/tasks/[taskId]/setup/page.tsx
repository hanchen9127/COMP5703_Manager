/**
 * Route: /tasks/[taskId]/setup
 *
 * Task definition, policy preview, and dataset registration use the parent layout's
 * `useTaskWorkspace` hydration (same path as Overview / History).
 */
import { TaskSetupReadPanel } from "@/components/task-setup-read-panel"
import { TaskWorkspacePage } from "@/components/task-workspace-shell"

type PageProps = {
  params: Promise<{
    taskId: string
  }>
}

export default function TaskSetupPage(_props: PageProps) {
  return (
    <TaskWorkspacePage>
      <TaskSetupReadPanel />
    </TaskWorkspacePage>
  )
}
