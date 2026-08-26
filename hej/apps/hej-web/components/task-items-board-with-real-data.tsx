"use client"

import { TaskItemsBoard } from "@/components/task-items-board"
import { useTaskWorkspace } from "@/components/task-workspace-client-shell"

export function TaskItemsBoardWithRealData() {
  const { view } = useTaskWorkspace()

  return (
    <TaskItemsBoard
      task={view.task}
      taskItems={view.taskItems}
      activity={view.activity}
    />
  )
}
