import { describe, expect, it } from "vitest"

import {
  formatTaskItemDisplayLabel,
  taskItemIdSecondaryLabel,
} from "@/lib/task-item-display-label"

describe("task-item-display-label", () => {
  it("prefers external ref over task item id", () => {
    expect(
      formatTaskItemDisplayLabel({
        taskItemId: "item_abc",
        externalItemRef: "527txt2.txt",
      }),
    ).toBe("527txt2.txt")
  })

  it("falls back to task item id when external ref is missing", () => {
    expect(
      formatTaskItemDisplayLabel({
        taskItemId: "item_abc",
        externalItemRef: null,
      }),
    ).toBe("item_abc")
  })

  it("shows secondary id only when primary label differs", () => {
    expect(
      taskItemIdSecondaryLabel({
        taskItemId: "item_abc",
        externalItemRef: "527txt2.txt",
      }),
    ).toBe("item_abc")
    expect(
      taskItemIdSecondaryLabel({
        taskItemId: "item_abc",
        externalItemRef: "item_abc",
      }),
    ).toBeNull()
  })
})
