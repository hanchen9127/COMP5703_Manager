import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useTaskItemContent } from "@/hooks/use-task-item-content"
import { runAnnotateAction } from "@/lib/task-item-actions"

import { TaskItemWorkspaceSheet } from "./task-item-workspace-sheet"
import type { MockTask, MockTaskItem } from "@/lib/domain/task-types"

vi.mock("@/hooks/use-task-item-content", () => ({
  useTaskItemContent: vi.fn(() => ({
    content: null,
    loading: false,
    error: null,
  })),
}))

vi.mock("@/lib/task-item-actions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/task-item-actions")>()

  return {
    ...actual,
    runAnnotateAction: vi.fn(),
  }
})

const mockedRunAnnotateAction = vi.mocked(runAnnotateAction)
const mockedUseTaskItemContent = vi.mocked(useTaskItemContent)

beforeEach(() => {
  mockedRunAnnotateAction.mockReset()
  mockedUseTaskItemContent.mockReset()
  mockedUseTaskItemContent.mockReturnValue({
    content: null,
    loading: false,
    error: null,
  })
  mockedRunAnnotateAction.mockResolvedValue({
    ok: true,
    data: {
      draft: {
        id: "draft-test",
        task_item_id: "item-test",
        status: "pending",
        annotation_type: "annotation",
        draft_data: {},
        created_at: "2026-01-01T00:00:00.000Z",
      },
    },
  } as Awaited<ReturnType<typeof runAnnotateAction>>)
})

afterEach(() => {
  cleanup()
})

const baseTask = {
  id: "task-test",
  projectId: "project-test",
  title: "Test annotation task",
  judgmentQuestion: "What should be annotated?",
  taskClass: "annotation",
  taskType: "text",
  taskSubtype: "text_span",
  executionMode: "human_first",
  dataSourceLabel: "Test dataset",
  annotationRules: "Use the test rules.",
  outputSchemaRef: "test-schema",
  textSpanLabelOptions: ["label"],
  reviewPolicyRef: "test-review-policy",
  disputePolicyRef: null,
  exportPolicyRef: null,
  status: "active",
  backlogCount: 0,
} satisfies MockTask

const textItem = {
  id: "item-text",
  taskId: baseTask.id,
  externalRef: "item-text",
  preview: "The claimant provided evidence in paragraph two.",
  aiLabel: "pending",
  confidence: "0.00",
  status: "in_progress",
  candidateOutput: "",
  draftPayloadText: "",
  draftNotes: "",
} satisfies MockTaskItem

const textSpanPayload = {
  kind: "text",
  version: 1,
  text_spans: [
    {
      id: "span-existing",
      start_offset: 4,
      end_offset: 12,
      text: "claimant",
      label: "evidence",
      notes: "Existing span",
    },
  ],
  notes: "Existing notes",
}

const textSpanPayloadText = JSON.stringify(textSpanPayload, null, 2)

const hydratedTextItem = {
  ...textItem,
  id: "item-text-hydrated",
  externalRef: "item-text-hydrated",
  preview: "The claimant provided evidence in paragraph two.",
  draftPayloadText: textSpanPayloadText,
  draftNotes: "Existing notes",
} satisfies MockTaskItem

const conflictingDraftItem = {
  ...hydratedTextItem,
  id: "item-text-conflicting-draft",
  externalRef: "item-text-conflicting-draft",
  draftAnnotationData: {
    kind: "text",
    spans: [
      {
        id: "span-structured",
        start_offset: 0,
        end_offset: 5,
        label: "structured",
        text: "Hello",
        notes: "Structured note",
      },
    ],
  },
} satisfies MockTaskItem

const invalidRawDraftItem = {
  ...hydratedTextItem,
  id: "item-text-invalid-raw-draft",
  externalRef: "item-text-invalid-raw-draft",
  draftPayloadText: "{invalid-json",
} satisfies MockTaskItem

const invalidRawWithStructuredDraftItem = {
  ...conflictingDraftItem,
  id: "item-text-invalid-raw-with-structured-draft",
  externalRef: "item-text-invalid-raw-with-structured-draft",
  draftPayloadText: "{invalid-json",
} satisfies MockTaskItem

const invalidReviewPayloadItem = {
  ...textItem,
  id: "item-text-invalid-review-payload",
  externalRef: "item-text-invalid-review-payload",
  candidateOutput: "{invalid-json",
  draftPayloadText: "",
} satisfies MockTaskItem

const imageBBoxPayload = {
  kind: "image_bbox",
  version: 1,
  imageUrl: "/media/test-image.png",
  boxes: [
    {
      id: "box-existing",
      label: "vehicle",
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    },
  ],
  notes: "Existing image notes",
}

const imageBBoxPayloadText = JSON.stringify(imageBBoxPayload, null, 2)

const imageTask = {
  ...baseTask,
  id: "task-image",
  taskType: "image",
} satisfies MockTask

const hydratedImageItem = {
  ...textItem,
  id: "item-image-hydrated",
  taskId: imageTask.id,
  externalRef: "item-image-hydrated",
  preview: "Image with a vehicle.",
  draftPayloadText: imageBBoxPayloadText,
  draftNotes: "Existing image notes",
  draftAnnotationData: undefined,
} satisfies MockTaskItem

const audioSegmentsPayload = {
  kind: "audio_segments",
  version: 1,
  audioUrl: "/media/test-audio.mp3",
  segments: [
    {
      id: "segment-existing",
      label: "claim",
      startTime: 1.25,
      endTime: 4.5,
      text: "Existing transcript",
      note: "Existing segment note",
    },
  ],
}

const audioSegmentsPayloadText = JSON.stringify(audioSegmentsPayload, null, 2)

const audioTask = {
  ...baseTask,
  id: "task-audio",
  taskType: "audio",
} satisfies MockTask

const hydratedAudioItem = {
  ...textItem,
  id: "item-audio-hydrated",
  taskId: audioTask.id,
  externalRef: "item-audio-hydrated",
  preview: "Audio clip with speech.",
  draftPayloadText: audioSegmentsPayloadText,
  draftNotes: "Existing audio notes",
  draftAnnotationData: undefined,
} satisfies MockTaskItem

describe("TaskItemWorkspaceSheet", () => {
  it("renders the no-item empty state when no item is selected", () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={null}
        activity={[]}
        open={true}
        initialTab="details"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("No item selected")).toBeInTheDocument()
  })
})

const fallbackImageTask = {
  ...baseTask,
  id: "task-fallback-image",
  title: "Fallback image annotation task",
  taskType: "image",
  taskSubtype: "generic_json",
  textSpanLabelOptions: null,
} satisfies MockTask

const fallbackImageItem = {
  id: "item-fallback-image",
  taskId: fallbackImageTask.id,
  externalRef: "item-fallback-image",
  preview: "Fallback image item preview",
  aiLabel: "pending",
  confidence: "0.00",
  status: "in_progress",
  candidateOutput: "{}",
  draftPayloadText: "{}",
  draftNotes: "",
} satisfies MockTaskItem

describe("TaskItemWorkspaceSheet fallback annotation validation", () => {
  it("renders raw annotation output validation for fallback image tasks", async () => {
    render(
      <TaskItemWorkspaceSheet
        task={fallbackImageTask}
        item={fallbackImageItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Format JSON")).toBeInTheDocument()
    expect(screen.getByText("Valid JSON")).toBeInTheDocument()

    const annotationOutput = screen.getByDisplayValue("{}")

    fireEvent.change(annotationOutput, { target: { value: "{" } })

    expect(screen.getByText(/Invalid JSON:/)).toBeInTheDocument()
  })
})

describe("TaskItemWorkspaceSheet fallback annotation actions", () => {
  it("sends raw annotation output when saving a fallback image draft", async () => {
    render(
      <TaskItemWorkspaceSheet
        task={fallbackImageTask}
        item={fallbackImageItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    const annotationOutput = screen.getByDisplayValue("{}")
    fireEvent.change(annotationOutput, {
      target: { value: '{"label":"fallback","confidence":0.42}' },
    })

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }))

    await waitFor(() => {
      expect(mockedRunAnnotateAction).toHaveBeenCalledWith({
        taskId: fallbackImageTask.id,
        itemId: fallbackImageItem.id,
        action: "save_draft",
        result: {
          payloadText: '{"label":"fallback","confidence":0.42}',
          notes: fallbackImageItem.draftNotes,
        },
      })
    })
  })
})

describe("TaskItemWorkspaceSheet text span label options", () => {
  it("renders task-specific text span quick labels in the annotator", () => {
    const task = {
      ...baseTask,
      textSpanLabelOptions: ["custom_a", "custom_b"],
    } satisfies MockTask

    render(
      <TaskItemWorkspaceSheet
        task={task}
        item={{ ...textItem, taskId: task.id }}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Text span annotator")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "custom_a" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "custom_b" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "supports" })).not.toBeInTheDocument()
  })

  it("falls back to default annotation text span quick labels when task labels are empty", () => {
    const task = {
      ...baseTask,
      textSpanLabelOptions: [],
    } satisfies MockTask

    render(
      <TaskItemWorkspaceSheet
        task={task}
        item={{ ...textItem, taskId: task.id }}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Text span annotator")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "supports" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "contradicts" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "insufficient_evidence" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "ambiguous" })).toBeInTheDocument()
  })

  it("does not render text span annotator for fallback image tasks", () => {
    render(
      <TaskItemWorkspaceSheet
        task={fallbackImageTask}
        item={fallbackImageItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.queryByText("Text span annotator")).not.toBeInTheDocument()
    expect(screen.getByText("Format JSON")).toBeInTheDocument()
  })
})

describe("TaskItemWorkspaceSheet structured text span payloads", () => {
  it("shows a precedence notice when both structured and raw draft sources exist", () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={conflictingDraftItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Using structured draft data")).toBeInTheDocument()
    expect(
      screen.getByText(/both structured draft data and raw payload text/i),
    ).toBeInTheDocument()
  })

  it("does not show the precedence notice when only raw draft payload text exists", () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={hydratedTextItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.queryByText("Using structured draft data")).not.toBeInTheDocument()
  })

  it("shows invalid raw draft warning when draft payload is invalid JSON without structured draft data", () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={invalidRawDraftItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Draft payload could not be parsed")).toBeInTheDocument()
    expect(
      screen.getByText(
        /invalid JSON, so the annotation workspace started from an empty\/default annotation state/i,
      ),
    ).toBeInTheDocument()
  })

  it("does not show invalid raw draft warning when structured draft data exists", () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={invalidRawWithStructuredDraftItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Using structured draft data")).toBeInTheDocument()
    expect(screen.queryByText("Draft payload could not be parsed")).not.toBeInTheDocument()
  })

  it("hydrates text span annotator from draftPayloadText text_spans", () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={hydratedTextItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Text span annotator")).toBeInTheDocument()
    expect(screen.getByText("evidence")).toBeInTheDocument()
    expect(screen.getByText("Existing span")).toBeInTheDocument()
  })

  it("saves hydrated text spans as structured text payload", async () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={hydratedTextItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }))

    await waitFor(() => {
      expect(mockedRunAnnotateAction).toHaveBeenCalled()
    })

    const payload = mockedRunAnnotateAction.mock.calls[0]?.[0]
    if (!payload) throw new Error("Expected runAnnotateAction to be called")
    const result = payload.result as { payloadText: string; notes?: string }

    expect(payload).toMatchObject({
      taskId: baseTask.id,
      itemId: hydratedTextItem.id,
      action: "save_draft",
    })
    expect(result).toMatchObject({
      notes: "Existing notes",
    })

    const parsed = JSON.parse(result.payloadText)
    expect(parsed).toMatchObject({
      kind: "text",
      version: 1,
      text_spans: [
        {
          id: "span-existing",
          start_offset: 4,
          end_offset: 12,
          text: "claimant",
          label: "evidence",
          notes: "Existing span",
        },
      ],
      notes: "Existing notes",
    })
  })

  it("submits hydrated text spans as structured text payload", async () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={hydratedTextItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /submit annotation/i }))

    await waitFor(() => {
      expect(mockedRunAnnotateAction).toHaveBeenCalled()
    })

    const payload = mockedRunAnnotateAction.mock.calls[0]?.[0]
    if (!payload) throw new Error("Expected runAnnotateAction to be called")
    const result = payload.result as { payloadText: string }

    expect(payload).toMatchObject({
      taskId: baseTask.id,
      itemId: hydratedTextItem.id,
      action: "submit",
    })

    const parsed = JSON.parse(result.payloadText)
    expect(parsed.kind).toBe("text")
    expect(parsed.version).toBe(1)
    expect(parsed.text_spans).toEqual([
      expect.objectContaining({
        id: "span-existing",
        start_offset: 4,
        end_offset: 12,
        text: "claimant",
        label: "evidence",
        notes: "Existing span",
      }),
    ])
  })

  it("renders readonly text span preview on the review tab from structured payload text", () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={{
          ...hydratedTextItem,
          status: "submitted",
        }}
        activity={[]}
        open={true}
        initialTab="review"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Submitted annotation")).toBeInTheDocument()
    expect(screen.getAllByText("Text spans").length).toBeGreaterThan(0)
    expect(screen.getByText("evidence")).toBeInTheDocument()
  })
})


describe("TaskItemWorkspaceSheet structured image bbox payloads", () => {
  beforeEach(() => {
    mockedUseTaskItemContent.mockReturnValue({
      content: {
        content_kind: "image",
        media_url: "/media/test-image.png",
        text: null,
        location_ref: "s3://test/image.png",
        source: "mock_fixture",
        truncated: false,
      },
      loading: false,
      error: null,
    })
  })

  it("hydrates image bbox annotator from draftPayloadText boxes", () => {
    render(
      <TaskItemWorkspaceSheet
        task={imageTask}
        item={hydratedImageItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Image annotation workspace")).toBeInTheDocument()
  })

  it("saves hydrated image boxes as structured image bbox payload", async () => {
    render(
      <TaskItemWorkspaceSheet
        task={imageTask}
        item={hydratedImageItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }))

    await waitFor(() => {
      expect(mockedRunAnnotateAction).toHaveBeenCalled()
    })

    const payload = mockedRunAnnotateAction.mock.calls[0]?.[0]
    if (!payload) throw new Error("Expected runAnnotateAction to be called")
    const result = payload.result as { payloadText: string; notes?: string }

    expect(payload).toMatchObject({
      taskId: imageTask.id,
      itemId: hydratedImageItem.id,
      action: "save_draft",
    })
    expect(result).toMatchObject({
      notes: "Existing image notes",
    })

    const parsed = JSON.parse(result.payloadText)
    expect(parsed).toMatchObject({
      kind: "image_bbox",
      version: 1,
      imageUrl: "/media/test-image.png",
      boxes: [
        {
          id: "box-existing",
          label: "vehicle",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
        },
      ],
      notes: "Existing image notes",
    })
  })

  it("submits hydrated image boxes as structured image bbox payload", async () => {
    render(
      <TaskItemWorkspaceSheet
        task={imageTask}
        item={hydratedImageItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /submit annotation/i }))

    await waitFor(() => {
      expect(mockedRunAnnotateAction).toHaveBeenCalled()
    })

    const payload = mockedRunAnnotateAction.mock.calls[0]?.[0]
    if (!payload) throw new Error("Expected runAnnotateAction to be called")
    const result = payload.result as { payloadText: string }

    expect(payload).toMatchObject({
      taskId: imageTask.id,
      itemId: hydratedImageItem.id,
      action: "submit",
    })

    const parsed = JSON.parse(result.payloadText)
    expect(parsed).toMatchObject({
      kind: "image_bbox",
      version: 1,
      imageUrl: "/media/test-image.png",
      boxes: [
        {
          id: "box-existing",
          label: "vehicle",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
        },
      ],
    })
  })
})

describe("TaskItemWorkspaceSheet review payload warnings", () => {
  it("shows review invalid payload warning when submitted payload is invalid JSON", () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={invalidReviewPayloadItem}
        activity={[]}
        open={true}
        initialTab="review"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Review payload could not be parsed")).toBeInTheDocument()
    expect(screen.getByText(/submitted payload is invalid JSON/i)).toBeInTheDocument()
  })

  it("does not show review invalid payload warning for valid structured payload", () => {
    render(
      <TaskItemWorkspaceSheet
        task={baseTask}
        item={hydratedTextItem}
        activity={[]}
        open={true}
        initialTab="review"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.queryByText("Review payload could not be parsed")).not.toBeInTheDocument()
  })
})

describe("TaskItemWorkspaceSheet structured audio segment payloads", () => {
  beforeEach(() => {
    mockedUseTaskItemContent.mockReturnValue({
      content: {
        content_kind: "audio",
        media_url: "/media/test-audio.mp3",
        text: null,
        location_ref: "s3://test/audio.mp3",
        source: "mock_fixture",
        truncated: false,
      },
      loading: false,
      error: null,
    })
  })

  it("hydrates audio segment annotator from draftPayloadText segments", () => {
    render(
      <TaskItemWorkspaceSheet
        task={audioTask}
        item={hydratedAudioItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Audio transcription workspace")).toBeInTheDocument()
    expect(screen.getByDisplayValue("1.25")).toBeInTheDocument()
    expect(screen.getByDisplayValue("4.5")).toBeInTheDocument()
    expect(screen.getByDisplayValue("claim")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Existing transcript")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Existing segment note")).toBeInTheDocument()
  })

  it("saves hydrated audio segments as structured audio payload", async () => {
    render(
      <TaskItemWorkspaceSheet
        task={audioTask}
        item={hydratedAudioItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }))

    await waitFor(() => {
      expect(mockedRunAnnotateAction).toHaveBeenCalled()
    })

    const payload = mockedRunAnnotateAction.mock.calls[0]?.[0]
    if (!payload) throw new Error("Expected runAnnotateAction to be called")
    const result = payload.result as { payloadText: string; notes?: string }

    expect(payload).toMatchObject({
      taskId: audioTask.id,
      itemId: hydratedAudioItem.id,
      action: "save_draft",
    })
    expect(result).toMatchObject({
      notes: "Existing audio notes",
    })

    const parsed = JSON.parse(result.payloadText)
    expect(parsed).toMatchObject({
      kind: "audio",
      version: 1,
      audioUrl: "/media/test-audio.mp3",
      segments: [
        {
          id: "segment-existing",
          start_seconds: 1.25,
          end_seconds: 4.5,
          label: "claim",
          transcript: "Existing transcript",
          notes: "Existing segment note",
        },
      ],
      notes: "Existing audio notes",
    })
  })

  it("submits hydrated audio segments as structured audio payload", async () => {
    render(
      <TaskItemWorkspaceSheet
        task={audioTask}
        item={hydratedAudioItem}
        activity={[]}
        open={true}
        initialTab="annotate"
        onOpenChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /submit annotation/i }))

    await waitFor(() => {
      expect(mockedRunAnnotateAction).toHaveBeenCalled()
    })

    const payload = mockedRunAnnotateAction.mock.calls[0]?.[0]
    if (!payload) throw new Error("Expected runAnnotateAction to be called")
    const result = payload.result as { payloadText: string }

    expect(payload).toMatchObject({
      taskId: audioTask.id,
      itemId: hydratedAudioItem.id,
      action: "submit",
    })

    const parsed = JSON.parse(result.payloadText)
    expect(parsed).toMatchObject({
      kind: "audio",
      version: 1,
      audioUrl: "/media/test-audio.mp3",
      segments: [
        {
          id: "segment-existing",
          start_seconds: 1.25,
          end_seconds: 4.5,
          label: "claim",
          transcript: "Existing transcript",
          notes: "Existing segment note",
        },
      ],
    })
  })

  it("renders readonly audio segment preview on the review tab from structured payload text", () => {
    render(
      <TaskItemWorkspaceSheet
        task={audioTask}
        item={{
          ...hydratedAudioItem,
          status: "submitted",
        }}
        activity={[]}
        open={true}
        initialTab="review"
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText("Audio annotation")).toBeInTheDocument()
    expect(screen.getByText("Audio segments")).toBeInTheDocument()
    expect(screen.getByText("1 segment")).toBeInTheDocument()
    expect(screen.getByText("claim")).toBeInTheDocument()
    expect(screen.getByText("Existing transcript")).toBeInTheDocument()
    expect(screen.getByText("Existing segment note")).toBeInTheDocument()
  })
})
