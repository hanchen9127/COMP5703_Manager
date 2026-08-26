import { TaskOverviewPanelWithRealData } from "@/components/task-overview-panel-with-real-data"
import { TaskWorkspacePage } from "@/components/task-workspace-shell"

export default function TaskPage() {
  return (
    <TaskWorkspacePage>
      <TaskOverviewPanelWithRealData />
    </TaskWorkspacePage>
  )
}
