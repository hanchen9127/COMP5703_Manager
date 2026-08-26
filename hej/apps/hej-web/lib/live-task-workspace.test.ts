import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ApiError } from "@/lib/api/client"
import type { ApiProject } from "@/lib/api/projects"
import { getProject } from "@/lib/api/projects"
import { listDraftsForTaskItem, listTaskItems, type ApiTaskItem } from "@/lib/api/task-items"
import { getTask, type ApiTask } from "@/lib/api/tasks"
import { fetchLiveTaskWorkspace } from "./live-task-workspace"

vi.mock("@/lib/api/tasks", () => ({
  getTask: vi.fn(),
}))

vi.mock("@/lib/api/task-items", () => ({
  listDraftsForTaskItem: vi.fn(),
  listTaskItems: vi.fn(),
}))

vi.mock("@/lib/api/projects", () => ({
  getProject: vi.fn(),
}))

const mockedGetTask = vi.mocked(getTask)
const mockedListDraftsForTaskItem = vi.mocked(listDraftsForTaskItem)
const mockedListTaskItems = vi.mocked(listTaskItems)
const mockedGetProject = vi.mocked(getProject)

const apiError = (message: string, status = 500): ApiError => ({ status, message })

const task: ApiTask = {
  id: "task_live_1",
  project_id: "proj_live_1",
  title: "Live task",
  description: "annotation/text_span",
  judgment_question: "Annotate this item",
  task_type: "text",
  annotation_mode: "human_first",
  label_schema_ref: "schema-1",
  text_span_label_options: null,
  review_policy_ref: "review-1",
  dispute_policy_ref: null,
  export_policy_ref: null,
  status: "ready",
  created_at: "2026-01-01T00:00:00.000Z",
  created_by: null,
  updated_at: null,
  updated_by: null,
}

const project: ApiProject = {
  id: "proj_live_1",
  organization_id: "org_live_1",
  name: "Live project",
  description: null,
  governance_model: "standard",
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  created_by: null,
  updated_at: null,
  updated_by: null,
}

const taskItem: ApiTaskItem = {
  id: "item-live-1",
  task_id: "task_live_1",
  data_pointer_id: "pointer-1",
  external_item_ref: "external-1",
  location_ref: "s3://bucket/item.txt",
  status: "pending",
  payload_preview: { text: "hello" },
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: null,
}

function expectApiErrorResult(
  result: Awaited<ReturnType<typeof fetchLiveTaskWorkspace>>,
  error: ApiError,
) {
  expect(result).toEqual({ ok: false, kind: "api-error", error })
  expect(result.ok).toBe(false)
  expect("data" in result).toBe(false)
}

describe("fetchLiveTaskWorkspace failure boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns api-error when the task API fails without seed workspace data", async () => {
    const error = apiError("task failed", 503)
    mockedGetTask.mockResolvedValueOnce({ ok: false, error })

    const result = await fetchLiveTaskWorkspace("task_live_1")

    expectApiErrorResult(result, error)
    expect(mockedListTaskItems).not.toHaveBeenCalled()
    expect(mockedGetProject).not.toHaveBeenCalled()
  })

  it("returns api-error when the task items API fails without seed workspace data", async () => {
    const error = apiError("items failed", 502)
    mockedGetTask.mockResolvedValueOnce({ ok: true, data: task })
    mockedListTaskItems.mockResolvedValueOnce({ ok: false, error })
    mockedGetProject.mockResolvedValueOnce({ ok: true, data: project })

    const result = await fetchLiveTaskWorkspace("task_live_1")

    expectApiErrorResult(result, error)
  })

  it("returns api-error when the project API fails without seed workspace data", async () => {
    const error = apiError("project failed", 404)
    mockedGetTask.mockResolvedValueOnce({ ok: true, data: task })
    mockedListTaskItems.mockResolvedValueOnce({ ok: true, data: [taskItem] })
    mockedGetProject.mockResolvedValueOnce({ ok: false, error })

    const result = await fetchLiveTaskWorkspace("task_live_1")

    expectApiErrorResult(result, error)
  })

  it("returns not-found when there is no backend bridge seed", async () => {
    const result = await fetchLiveTaskWorkspace("not-a-backend-task-id")

    expect(result).toEqual({ ok: false, kind: "not-found" })
    expect(mockedGetTask).not.toHaveBeenCalled()
    expect("data" in result).toBe(false)
  })

  it("returns api-error when mapping fails without seed workspace data", async () => {
    mockedGetTask.mockResolvedValueOnce({
      ok: true,
      data: { ...task, description: {} as ApiTask["description"] },
    })
    mockedListTaskItems.mockResolvedValueOnce({ ok: true, data: [taskItem] })
    mockedGetProject.mockResolvedValueOnce({ ok: true, data: project })

    const result = await fetchLiveTaskWorkspace("task_live_1")

    expect(result.ok).toBe(false)
    expect(result).toMatchObject({
      kind: "api-error",
      error: {
        status: 0,
      },
    })
    if (!result.ok && result.kind === "api-error") {
      expect(result.error.message).toBeTruthy()
    }    
    expect("data" in result).toBe(false)
  })
})

describe("fetchLiveTaskWorkspace draft hydration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("hydrates saved pending drafts into live task workspace items", async () => {
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

    mockedGetTask.mockResolvedValueOnce({ ok: true, data: task })
    mockedListTaskItems.mockResolvedValueOnce({ ok: true, data: [taskItem] })
    mockedGetProject.mockResolvedValueOnce({ ok: true, data: project })
    mockedListDraftsForTaskItem.mockResolvedValueOnce({
      ok: true,
      data: {
        task_item_id: taskItem.id,
        drafts: [
          {
            id: "draft-live-1",
            task_item_id: taskItem.id,
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
        total_count: 1,
      },
    })

    const result = await fetchLiveTaskWorkspace("task_live_1")

    expect(result.ok).toBe(true)
    if (!result.ok) {
      throw new Error("expected live task workspace fetch to succeed")
    }

    expect(mockedListDraftsForTaskItem).toHaveBeenCalledWith(taskItem.id)
    expect(result.data.taskItems).toHaveLength(1)

    const hydratedItem = result.data.taskItems[0]
    expect(hydratedItem).toBeDefined()
    if (!hydratedItem) {
      throw new Error("expected a hydrated task item")
    }

    expect(hydratedItem.draftPayloadText).toBe(outputText)
    expect(hydratedItem.draftNotes).toBe("draft note")
    expect(hydratedItem.draftAnnotationData).toMatchObject({
      kind: "text",
      text: "Alpha beta gamma",
    })
  })

  it("keeps live task items when draft hydration fails for an item", async () => {
    mockedGetTask.mockResolvedValueOnce({ ok: true, data: task })
    mockedListTaskItems.mockResolvedValueOnce({ ok: true, data: [taskItem] })
    mockedGetProject.mockResolvedValueOnce({ ok: true, data: project })
    mockedListDraftsForTaskItem.mockResolvedValueOnce({
      ok: false,
      error: apiError("drafts failed", 500),
    })

    const result = await fetchLiveTaskWorkspace("task_live_1")

    expect(result.ok).toBe(true)
    if (!result.ok) {
      throw new Error("expected live task workspace fetch to succeed")
    }

    expect(mockedListDraftsForTaskItem).toHaveBeenCalledWith(taskItem.id)
    expect(result.data.taskItems).toHaveLength(1)

    const hydratedItem = result.data.taskItems[0]
    expect(hydratedItem).toBeDefined()
    if (!hydratedItem) {
      throw new Error("expected a hydrated task item")
    }

    expect(hydratedItem.id).toBe(taskItem.id)
    expect(hydratedItem.draftPayloadText).toBeUndefined()
    expect(hydratedItem.draftAnnotationData).toBeUndefined()
  })
})

