import { describe, expect, it } from "vitest"

import { TASK_ITEM_STATUS } from "@/lib/domain/task-status"
import type { MockTaskItem } from "@/lib/domain/task-types"
import {
  ANNOTATE_PAGE_FILTERS,
  resolveSelectedTaskItem,
  resolveStageFilterKeyForItemStatus,
} from "@/lib/task-format"

function makeItem(id: string, status: MockTaskItem["status"]): MockTaskItem {
  return {
    id,
    taskId: "task-1",
    externalRef: id,
    preview: "preview",
    status,
    confidence: "n/a",
    aiLabel: "n/a",
  }
}

describe("resolveSelectedTaskItem", () => {
  it("keeps the selected item visible when it falls outside the active filter", () => {
    const returnedItem = makeItem("item-returned", TASK_ITEM_STATUS.RETURNED)
    const draftItem = makeItem("item-draft", TASK_ITEM_STATUS.IN_PROGRESS)
    const items = [returnedItem, draftItem]

    expect(
      resolveSelectedTaskItem(items, [draftItem], "item-returned"),
    ).toBe(returnedItem)
  })

  it("returns null when nothing matches and the filtered table is empty", () => {
    const items = [makeItem("item-returned", TASK_ITEM_STATUS.RETURNED)]

    expect(resolveSelectedTaskItem(items, [], "missing-item")).toBeNull()
  })
})

describe("resolveStageFilterKeyForItemStatus", () => {
  it("maps save-draft transitions from returned to the draft filter", () => {
    expect(
      resolveStageFilterKeyForItemStatus(
        "returned",
        TASK_ITEM_STATUS.IN_PROGRESS,
        ANNOTATE_PAGE_FILTERS,
      ),
    ).toBe("draft")
  })

  it("leaves the filter unchanged when the status still belongs to it", () => {
    expect(
      resolveStageFilterKeyForItemStatus(
        "returned",
        TASK_ITEM_STATUS.RETURNED,
        ANNOTATE_PAGE_FILTERS,
      ),
    ).toBeNull()
  })
})
