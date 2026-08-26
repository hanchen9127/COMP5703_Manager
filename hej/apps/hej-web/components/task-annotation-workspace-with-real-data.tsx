"use client"

import { useEffect, useState } from "react"

import { TaskAnnotationWorkspace } from "@/components/task-annotation-workspace"
import { useTaskWorkspace } from "@/components/task-workspace-client-shell"
import { listDraftsForTaskItem } from "@/lib/api/task-items"

import { applyApiDraftsToMockItem } from "@/lib/task-workspace-data"
import type { MockTaskItem } from "@/lib/domain/task-types"

type TaskAnnotationWorkspaceWithRealDataProps = {
  initialItemId?: string
  initialFilter?: string
}

/**
 * Annotate tab — uses the same hydrated task workspace view as Overview/Items.
 * Enriches task items with per-item drafts for the annotation work panel.
 */
export function TaskAnnotationWorkspaceWithRealData({
  initialItemId,
  initialFilter,
}: TaskAnnotationWorkspaceWithRealDataProps) {
  const { view } = useTaskWorkspace()
  const { task, taskItems, activity } = view
  const [items, setItems] = useState<MockTaskItem[]>(taskItems)

  useEffect(() => {
    setItems(taskItems)
  }, [taskItems])

  useEffect(() => {
    if (taskItems.length === 0) {
      return
    }

    let cancelled = false

    void (async () => {
      const enriched = await Promise.all(
        taskItems.map(async (item) => {
          const draftResult = await listDraftsForTaskItem(item.id)
          if (!draftResult.ok) {
            return item
          }
          return applyApiDraftsToMockItem(item, draftResult.data.drafts, task.taskType)
        }),
      )

      if (!cancelled) {
        setItems(enriched)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [task.taskType, taskItems])

  return (
    <TaskAnnotationWorkspace
      task={task}
      taskItems={items}
      activity={activity}
      initialItemId={initialItemId}
      initialFilter={initialFilter}
    />
  )
}
