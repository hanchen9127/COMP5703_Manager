"use client"

import Link from "next/link"
import { useState } from "react"

import { TaskOverviewPanel } from "@/components/task-overview-panel"
import { TaskSidePanels } from "@/components/task-side-panels"
import { useTaskWorkspace } from "@/components/task-workspace-client-shell"
import { getTaskItemStatusCounts } from "@/lib/task-format"
import { completeTask } from "@/lib/api/tasks"

export function TaskOverviewPanelWithRealData() {
  const { view, taskId, retry } = useTaskWorkspace()
  const { task, taskItems, workflow, assignments, project } = view
  const [completionState, setCompletionState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "success"; message: string } | { kind: "error"; message: string }
  >({ kind: "idle" })

  const itemCounts = getTaskItemStatusCounts(taskItems)
  const finalizedCount = itemCounts.approved ?? 0
  const totalCount = taskItems.length
  const canCompleteTask = totalCount > 0 && finalizedCount === totalCount

  return (
    <div className="space-y-4">
      <TaskOverviewPanel
        task={task}
        taskItems={taskItems}
        workflow={workflow}
        assignments={assignments}
        finalizedCount={finalizedCount}
        totalCount={totalCount}
        canCompleteTask={canCompleteTask}
        completionStatus={completionState}
        onCompleteTask={async () => {
          setCompletionState({ kind: "loading" })
          const result = await completeTask(project.id, task.id)
          if (result.ok) {
            await retry()
            setCompletionState({ kind: "success", message: "Task completed successfully." })
            return
          }
          const message = result.error?.message || "Failed to complete task. Please try again."
          setCompletionState({ kind: "error", message })
        }}
      />

      <TaskSidePanels
        assignments={assignments}
        workflow={workflow}
        approvedCount={itemCounts.approved ?? 0}
        totalCount={taskItems.length}
      />

      <div className="flex justify-end px-1">
        <Link
          href={`/tasks/${taskId}/history`}
          className="text-[13px] font-medium text-slate-900 underline-offset-2 hover:underline"
        >
          Open History
        </Link>
      </div>
    </div>
  )
}
