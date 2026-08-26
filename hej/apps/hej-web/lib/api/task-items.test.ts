import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiClient, type ApiError } from "./client"
import {
  saveDraft,
  submitTaskItem,
  type ApiDraft,
  type ApiDraftListResponse,
} from "./task-items"
import type { AnnotateActionPayload } from "@/lib/task-item-actions"

vi.mock("./client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

const mockedApiClient = vi.mocked(apiClient)

const apiError = (message: string, status = 500): ApiError => ({ status, message })

const annotatePayload: AnnotateActionPayload = {
  taskId: "task-1",
  itemId: "item-1",
  action: "save_draft",
  result: {
    payloadText: "{}",
    notes: "test note",
  },
}

const draft: ApiDraft = {
  id: "draft-1",
  task_item_id: "item-1",
  status: "pending",
  annotation_type: "annotation",
  draft_data: {},
  created_at: "2026-01-01T00:00:00.000Z",
}

const emptyDraftList: ApiDraftListResponse = {
  task_item_id: "item-1",
  drafts: [],
  total_count: 0,
}

const pendingDraftList: ApiDraftListResponse = {
  task_item_id: "item-1",
  drafts: [draft],
  total_count: 1,
}

function expectExplicitFailure(result: Awaited<ReturnType<typeof saveDraft>>, error: ApiError) {
  expect(result).toEqual({ ok: false, error })
  expect(result.ok).toBe(false)
  expect("synthetic" in result).toBe(false)
}

describe("task item mutation failure boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns explicit failure when listing drafts fails", async () => {
    const error = apiError("list drafts failed", 503)
    mockedApiClient.get.mockResolvedValueOnce({ ok: false, error })

    const result = await saveDraft("task-1", "item-1", annotatePayload)

    expectExplicitFailure(result, error)
    expect(mockedApiClient.post).not.toHaveBeenCalled()
    expect(mockedApiClient.patch).not.toHaveBeenCalled()
  })

  it("returns explicit failure when creating a draft fails", async () => {
    const error = apiError("create draft failed", 500)
    mockedApiClient.get.mockResolvedValueOnce({ ok: true, data: emptyDraftList })
    mockedApiClient.post.mockResolvedValueOnce({ ok: false, error })

    const result = await saveDraft("task-1", "item-1", annotatePayload)

    expectExplicitFailure(result, error)
  })

  it("returns explicit failure when updating a draft fails", async () => {
    const error = apiError("update draft failed", 409)
    mockedApiClient.get.mockResolvedValueOnce({ ok: true, data: pendingDraftList })
    mockedApiClient.patch.mockResolvedValueOnce({ ok: false, error })

    const result = await saveDraft("task-1", "item-1", annotatePayload)

    expectExplicitFailure(result, error)
  })

  it("returns explicit failure when submitting a saved draft fails", async () => {
    const error = apiError("submit draft failed", 502)
    mockedApiClient.get.mockResolvedValueOnce({ ok: true, data: pendingDraftList })
    mockedApiClient.patch.mockResolvedValueOnce({ ok: true, data: draft })
    mockedApiClient.post.mockResolvedValueOnce({ ok: false, error })

    const result = await submitTaskItem("task-1", "item-1", annotatePayload)

    expect(result).toEqual({ ok: false, error })
    expect(result.ok).toBe(false)
    expect("synthetic" in result).toBe(false)
  })

  it("forces creating a new pending draft when resubmitting a returned item", async () => {
    const returnedPayload: AnnotateActionPayload = {
      ...annotatePayload,
      action: "submit",
      itemStatus: "returned",
    }
    mockedApiClient.get.mockResolvedValueOnce({ ok: true, data: pendingDraftList })
    mockedApiClient.post
      .mockResolvedValueOnce({ ok: true, data: draft })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          id: draft.id,
          status: "submitted",
          submitted_at: "2026-01-01T00:00:00.000Z",
          message: "Draft submitted for review",
        },
      })

    const result = await submitTaskItem("task-1", "item-1", returnedPayload)

    expect(result.ok).toBe(true)
    expect(mockedApiClient.patch).not.toHaveBeenCalled()
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      1,
      "/task-items/item-1/drafts",
      expect.any(Object),
    )
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      2,
      `/drafts/${draft.id}/submit`,
      expect.any(Object),
    )
  })

  it("reuses pending draft for normal submit statuses", async () => {
    const submittedPayload: AnnotateActionPayload = {
      ...annotatePayload,
      action: "submit",
      itemStatus: "in_progress",
    }
    mockedApiClient.get.mockResolvedValueOnce({ ok: true, data: pendingDraftList })
    mockedApiClient.patch.mockResolvedValueOnce({ ok: true, data: draft })
    mockedApiClient.post.mockResolvedValueOnce({
      ok: true,
      data: {
        id: draft.id,
        status: "submitted",
        submitted_at: "2026-01-01T00:00:00.000Z",
        message: "Draft submitted for review",
      },
    })

    const result = await submitTaskItem("task-1", "item-1", submittedPayload)

    expect(result.ok).toBe(true)
    expect(mockedApiClient.patch).toHaveBeenCalledOnce()
    expect(mockedApiClient.post).toHaveBeenCalledOnce()
  })

  it("does not return synthetic success for legacy item action failures", async () => {
    const { approveTaskItem, rejectTaskItem, escalateTaskItem } = await import("./task-items")
    const error = apiError("action failed", 500)

    for (const action of [approveTaskItem, rejectTaskItem, escalateTaskItem]) {
      mockedApiClient.post.mockResolvedValueOnce({ ok: false, error })

      const result = await action("task-1", "item-1", {
        taskId: "task-1",
        itemId: "item-1",
        action: "accept_review",
        decision: "approve",
        comment: "review note",
      })

      expect(result).toEqual({ ok: false, error })
      expect(result.ok).toBe(false)
      expect("synthetic" in result).toBe(false)
    }
  })
})
