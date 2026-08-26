import { TaskItemsBoardWithRealData } from "@/components/task-items-board-with-real-data"
import { TaskWorkspacePage } from "@/components/task-workspace-shell"

export default function TaskItemsPage() {
  return (
    <TaskWorkspacePage>
      <TaskItemsBoardWithRealData />
    </TaskWorkspacePage>
  )
}
