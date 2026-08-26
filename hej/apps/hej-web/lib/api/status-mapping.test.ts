import { describe, expect, it } from "vitest"

import {
  getTaskItemStatusDisplayLabel,
  mapBackendItemStatus,
  normalizeTaskItemStatus,
} from "@/lib/api/status-mapping"

describe("status-mapping expert_send_back", () => {
  it("maps backend expert_send_back to UI returned", () => {
    expect(mapBackendItemStatus("expert_send_back")).toBe("returned")
  })

  it("displays Returned label for expert_send_back", () => {
    expect(getTaskItemStatusDisplayLabel("expert_send_back")).toBe("Returned")
    expect(normalizeTaskItemStatus("expert_send_back")).toBe("returned")
  })
})
