import { describe, expect, it } from "vitest"

import { TASK_ITEM_STATUS } from "@/lib/domain/task-status"
import type { MockTaskItem } from "@/lib/domain/task-types"
import {
  buildAnnotateDistribution,
  buildOverviewLifecycleSegments,
  computeDistributionMajority,
} from "@/lib/task-stage-kpis"
import { getTaskItemStatusCounts } from "@/lib/task-format"

function item(status: MockTaskItem["status"], id = "item_1"): MockTaskItem {
  return {
    id,
    taskId: "task_1",
    externalRef: id,
    preview: "preview",
    aiLabel: "unknown",
    confidence: "n/a",
    status,
  }
}

describe("buildOverviewLifecycleSegments", () => {
  it("returns all lifecycle buckets including zeros", () => {
    const counts = getTaskItemStatusCounts([
      item(TASK_ITEM_STATUS.IN_PROGRESS, "a"),
      item(TASK_ITEM_STATUS.REJECTED, "b"),
    ])
    const segments = buildOverviewLifecycleSegments(counts)

    expect(segments).toHaveLength(6)
    expect(segments.map((s) => s.label)).toEqual([
      "Draft",
      "Submitted",
      "Returned",
      "Approved",
      "Rejected",
      "Disputed",
    ])
    expect(segments.find((s) => s.label === "Returned")?.count).toBe(0)
  })
})

describe("buildAnnotateDistribution", () => {
  it("includes fixed queue and out-of-scope segments even when count is zero", () => {
    const items = [
      item(TASK_ITEM_STATUS.IN_PROGRESS, "a"),
      item(TASK_ITEM_STATUS.SUBMITTED, "b"),
      item(TASK_ITEM_STATUS.APPROVED, "c"),
      item(TASK_ITEM_STATUS.REJECTED, "d"),
    ]
    const bundle = buildAnnotateDistribution(items)

    expect(bundle.distributionSegments).toHaveLength(6)
    expect(bundle.queueSegments).toHaveLength(3)
    expect(bundle.outOfScopeSegments).toHaveLength(2)
    expect(bundle.handedToReview.count).toBe(1)

    const returned = bundle.queueSegments.find((s) => s.filterKey === "returned")
    expect(returned?.count).toBe(0)

    const labels = bundle.distributionSegments.map((s) => s.label)
    expect(labels).toContain("Returned")
    expect(labels).toContain("Handed to review")
    expect(labels).toContain("Disputed")
    expect(bundle.outOfScopeSegments.find((s) => s.status === TASK_ITEM_STATUS.DISPUTED)?.count).toBe(
      0,
    )
  })
})

describe("computeDistributionMajority", () => {
  it("ignores zero-count segments", () => {
    const counts = getTaskItemStatusCounts([item(TASK_ITEM_STATUS.IN_PROGRESS)])
    const segments = buildOverviewLifecycleSegments(counts)
    const majority = computeDistributionMajority(segments)

    expect(majority?.label).toBe("Draft")
    expect(majority?.count).toBe(1)
  })

  it("returns null when every segment is zero", () => {
    const counts = getTaskItemStatusCounts([])
    const segments = buildOverviewLifecycleSegments(counts)
    expect(computeDistributionMajority(segments)).toBeNull()
  })
})
