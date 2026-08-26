import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { TASK_ITEM_STATUS } from "@/lib/domain/task-status"
import {
  formatTaskItemAiLabel,
  formatTaskItemConfidence,
  applyApiDraftsToMockItem,
  formatTaskItemPreview,
  getTaskWorkspaceView,
  mapApiItemToMock,
} from "./task-workspace-data"

describe("task item display formatting helpers", () => {
  it("formats missing preview with the existing UI placeholder", () => {
    expect(formatTaskItemPreview(undefined)).toBe("No preview available")
  })

  it("formats missing or empty AI label with the existing UI placeholder", () => {
    expect(formatTaskItemAiLabel(undefined)).toBe("unknown")
    expect(formatTaskItemAiLabel("   ")).toBe("unknown")
  })

  it("formats missing confidence with the existing UI placeholder", () => {
    expect(formatTaskItemConfidence(undefined)).toBe("n/a")
  })
})

describe("mapApiItemToMock current bridge defaults", () => {
  it("currently defaults missing id to unknown_item_id; should move to explicit DTO validation later", () => {
    const item = mapApiItemToMock("task-1", {
      status: "pending",
      external_item_ref: "external-1",
      payload_preview: { text: "Preview text" },
    })

    expect(item.id).toBe("unknown_item_id")
  })

  it("currently defaults empty id to unknown_item_id; should move to explicit DTO validation later", () => {
    const item = mapApiItemToMock("task-1", {
      id: "   ",
      status: "pending",
      external_item_ref: "external-1",
      payload_preview: { text: "Preview text" },
    })

    expect(item.id).toBe("unknown_item_id")
  })

  it("currently delegates missing preview formatting to a named display helper", () => {
    const item = mapApiItemToMock("task-1", {
      id: "item-1",
      status: "pending",
      external_item_ref: "external-1",
    })

    expect(item.preview).toBe(formatTaskItemPreview(undefined))
  })

  it("currently delegates missing AI label formatting to a named display helper", () => {
    const item = mapApiItemToMock("task-1", {
      id: "item-1",
      status: "pending",
      external_item_ref: "external-1",
      payload_preview: { text: "Preview text" },
    })

    expect(item.aiLabel).toBe(formatTaskItemAiLabel(undefined))
  })

  it("currently delegates empty AI label formatting to a named display helper", () => {
    const item = mapApiItemToMock("task-1", {
      id: "item-1",
      status: "pending",
      external_item_ref: "external-1",
      payload_preview: { text: "Preview text", ai_label: "   " },
    })

    expect(item.aiLabel).toBe(formatTaskItemAiLabel(""))
  })

  it("currently delegates missing confidence formatting to a named display helper", () => {
    const item = mapApiItemToMock("task-1", {
      id: "item-1",
      status: "pending",
      external_item_ref: "external-1",
      payload_preview: { text: "Preview text" },
    })

    expect(item.confidence).toBe(formatTaskItemConfidence(undefined))
  })

  it("currently maps unknown item status to UNSTARTED and preserves original status; should become explicit parse failure later", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

    const item = mapApiItemToMock("task-1", {
      id: "item-1",
      status: "surprise_status",
      external_item_ref: "external-1",
      payload_preview: { text: "Preview text" },
    })

    expect(item.status).toBe(TASK_ITEM_STATUS.UNSTARTED)
    expect(item.apiOriginalStatus).toBe("surprise_status")
    expect(warn).toHaveBeenCalledWith("Unknown task item status from API:", "surprise_status")

    warn.mockRestore()
  })
})

describe("getTaskWorkspaceView API task bridge mapping", () => {
  const originalFetch = global.fetch
  const taskId = "task_test_text_labels"

  beforeEach(() => {
    global.fetch = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      const url = String(input)

      if (url.endsWith(`/tasks/${taskId}`)) {
        return new Response(
          JSON.stringify({
            task_type: "text",
            text_span_label_options: ["claim", " evidence ", "", 123, "risk"],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        )
      }

      if (url.endsWith(`/tasks/${taskId}/task-items`)) {
        return new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }

      return new Response(null, { status: 404 })
    }) as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("preserves and normalizes API text span label options on the bridge task", async () => {
    const view = await getTaskWorkspaceView(taskId)

    expect(view?.task.textSpanLabelOptions).toEqual(["claim", "evidence", "risk"])
  })
})

describe("applyApiDraftsToMockItem", () => {
  it("hydrates annotation data from draft_data.output before falling back to wrapper draft data", () => {
    const outputText = JSON.stringify({
      kind: "text",
      text: "Alpha beta gamma",
      text_spans: [
        {
          id: "span-1",
          start_offset: 0,
          end_offset: 5,
          label: "claim",
          text: "Alpha",
        },
      ],
    })

    const item = mapApiItemToMock("task-1", {
      id: "item-1",
      status: "pending",
      external_item_ref: "external-1",
      payload_preview: { text: "Preview text" },
    })

    const hydrated = applyApiDraftsToMockItem(
      item,
      [
        {
          id: "draft-1",
          task_item_id: "item-1",
          annotation_id: null,
          status: "pending",
          annotation_type: "annotation",
          draft_data: {
            output: JSON.parse(outputText),
            output_text: outputText,
            notes: "draft note",
          },
          revision_notes: "draft note",
          created_by: null,
          created_at: "2026-01-01T00:00:00.000Z",
          submitted_at: null,
          updated_at: null,
        },
      ],
      "text",
    )

    expect(hydrated.draftPayloadText).toBe(outputText)
    expect(hydrated.draftNotes).toBe("draft note")
    expect(hydrated.draftAnnotationData).toMatchObject({
      kind: "text",
      text: "Alpha beta gamma",
    })
  })

  it("keeps rejected status when an older submitted draft still exists", () => {
    const item = mapApiItemToMock("task-1", {
      id: "item-1",
      status: "rejected",
      external_item_ref: "external-1",
      payload_preview: { text: "Preview text" },
    })

    const hydrated = applyApiDraftsToMockItem(
      item,
      [
        {
          id: "draft-1",
          task_item_id: "item-1",
          annotation_id: null,
          status: "submitted",
          annotation_type: "annotation",
          draft_data: { output_text: "{}", notes: "" },
          revision_notes: null,
          created_by: null,
          created_at: "2026-01-01T00:00:00.000Z",
          submitted_at: "2026-01-02T00:00:00.000Z",
          updated_at: null,
        },
      ],
      "text",
    )

    expect(hydrated.status).toBe(TASK_ITEM_STATUS.REJECTED)
  })

  it("keeps returned status even if an older submitted draft exists", () => {
    const item = mapApiItemToMock("task-1", {
      id: "item-1",
      status: "returned",
      external_item_ref: "external-1",
      payload_preview: { text: "Preview text" },
    })

    const hydrated = applyApiDraftsToMockItem(
      item,
      [
        {
          id: "draft-1",
          task_item_id: "item-1",
          annotation_id: null,
          status: "submitted",
          annotation_type: "annotation",
          draft_data: { output_text: "{}", notes: "" },
          revision_notes: null,
          created_by: null,
          created_at: "2026-01-01T00:00:00.000Z",
          submitted_at: "2026-01-02T00:00:00.000Z",
          updated_at: null,
        },
      ],
      "text",
    )

    expect(hydrated.status).toBe(TASK_ITEM_STATUS.RETURNED)
  })
})

