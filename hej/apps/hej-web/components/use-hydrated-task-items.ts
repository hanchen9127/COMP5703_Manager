"use client"

import { useEffect, useState } from "react"

import { listDraftsForTaskItem, listTaskItems } from "@/lib/api/task-items"
import { applyApiDraftsToMockItem, mapApiItemToMock } from "@/lib/task-workspace-data"
import type { MockTaskItem } from "@/lib/domain/task-types"

export function useHydratedTaskItems(
  taskId: string,
  initialItems: MockTaskItem[],
  taskType: "text" | "image" | "audio" = "text",
) {
  const [items, setItems] = useState<MockTaskItem[]>(initialItems)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const result = await listTaskItems(taskId)
      if (cancelled || !result.ok) return

      const mapped = result.data.map((apiItem) => mapApiItemToMock(taskId, apiItem))
      const merged = await Promise.all(
        mapped.map(async (item) => {
          const draftResult = await listDraftsForTaskItem(item.id)
          if (!draftResult.ok) {
            return item
          }
          return applyApiDraftsToMockItem(item, draftResult.data.drafts, taskType)
        }),
      )
      if (cancelled) return
      setItems(merged)
    })()

    return () => {
      cancelled = true
    }
  }, [taskId, initialItems, taskType])

  return items
}
