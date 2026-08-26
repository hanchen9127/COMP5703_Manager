"use client"

import { useCallback, type Dispatch, type SetStateAction } from "react"

import { useTaskWorkspace } from "@/components/task-workspace-client-shell"
import type { MockTaskItem } from "@/lib/domain/task-types"
import type { TaskActionCompleteEvent } from "@/lib/task-item-actions"

function mergeTaskItemUpdate(
  currentItems: MockTaskItem[],
  updatedItem: MockTaskItem,
): MockTaskItem[] {
  return currentItems.map((item) =>
    item.id === updatedItem.id ? updatedItem : item,
  )
}

/**
 * Keeps page-local item lists and the layout-level workspace cache in sync
 * after work-panel actions (optimistic UI + background re-hydrate).
 */
export function useTaskItemWorkspaceSync() {
  const { patchTaskItem, retry } = useTaskWorkspace()

  const syncItemUpdated = useCallback(
    (
      updatedItem: MockTaskItem,
      setLocalItems?: Dispatch<SetStateAction<MockTaskItem[]>>,
    ) => {
      patchTaskItem(updatedItem)
      setLocalItems?.((current) => mergeTaskItemUpdate(current, updatedItem))
    },
    [patchTaskItem],
  )

  const syncActionComplete = useCallback(
    (
      _event?: TaskActionCompleteEvent,
      options?: { skipRefresh?: boolean },
    ) => {
      if (options?.skipRefresh) {
        return
      }
      void retry()
    },
    [retry],
  )

  return {
    syncItemUpdated,
    syncActionComplete,
    refreshWorkspace: retry,
  }
}
