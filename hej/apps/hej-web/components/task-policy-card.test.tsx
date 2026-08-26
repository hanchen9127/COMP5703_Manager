import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { TaskPolicyCard } from "./task-policy-card"
import { getTask, updateTask } from "@/lib/api/tasks"
import type { MockTask } from "@/lib/domain/task-types"

vi.mock("@/lib/api/tasks", () => ({
  getTask: vi.fn(),
  updateTask: vi.fn(),
}))

const mockedGetTask = vi.mocked(getTask)
const mockedUpdateTask = vi.mocked(updateTask)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const baseTask: MockTask = {
  id: "task-1",
  projectId: "project-1",
  title: "Task 1",
  judgmentQuestion: "Q",
  taskClass: "annotation",
  taskType: "text",
  taskSubtype: "text_annotation",
  executionMode: "ai_assisted",
  dataSourceLabel: "ds",
  annotationRules: "rules",
  outputSchemaRef: "sentiment_classification_schema_v1",
  textSpanLabelOptions: ["existing_label"],
  reviewPolicyRef: "review_dual_signoff_v1",
  disputePolicyRef: null,
  exportPolicyRef: null,
  status: "draft",
  backlogCount: 0,
}

describe("TaskPolicyCard", () => {
  beforeEach(() => {
    mockedGetTask.mockResolvedValue({
      ok: true,
      data: {
        id: "task-1",
        project_id: "project-1",
        title: "Task 1",
        description: "annotation / text_annotation",
        judgment_question: "Q",
        task_type: "text",
        annotation_mode: "ai_assisted",
        label_schema_ref: "sentiment_classification_schema_v1",
        text_span_label_options: ["existing_label"],
        review_policy_ref: "review_dual_signoff_v1",
        dispute_policy_ref: null,
        export_policy_ref: null,
        status: "draft",
        created_at: "2026-01-01T00:00:00.000Z",
        created_by: null,
        updated_at: null,
        updated_by: null,
      },
    } as Awaited<ReturnType<typeof getTask>>)

    mockedUpdateTask.mockResolvedValue({
      ok: true,
      data: {
        id: "task-1",
        project_id: "project-1",
        title: "Task 1",
        description: "annotation / text_annotation",
        judgment_question: "Q",
        task_type: "text",
        annotation_mode: "ai_assisted",
        label_schema_ref: "sentiment_classification_schema_v1",
        text_span_label_options: ["existing_label", "updated_label"],
        review_policy_ref: "review_dual_signoff_v1",
        dispute_policy_ref: null,
        export_policy_ref: null,
        status: "draft",
        created_at: "2026-01-01T00:00:00.000Z",
        created_by: null,
        updated_at: null,
        updated_by: null,
      },
    } as Awaited<ReturnType<typeof updateTask>>)
  })

  it("updates text span quick labels via save flow", async () => {
    render(
      <TaskPolicyCard
        projectId="project-1"
        task={baseTask}
        organizationPolicy={null}
        canEdit={true}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Edit refs" }))
    fireEvent.change(screen.getByPlaceholderText("Add a label"), {
      target: { value: "updated_label" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))
    expect(screen.getByText("updated_label")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Save refs" }))

    await waitFor(() => {
      expect(mockedGetTask).toHaveBeenCalledWith("task-1")
    })

    expect(mockedUpdateTask).toHaveBeenCalledWith(
      "project-1",
      "task-1",
      expect.objectContaining({
        text_span_label_options: ["existing_label", "updated_label"],
      }),
    )
  })

  it("does not show quick label editor for non-text tasks", () => {
    const imageTask = {
      ...baseTask,
      taskType: "image" as const,
      textSpanLabelOptions: null,
    }

    render(
      <TaskPolicyCard
        projectId="project-1"
        task={imageTask}
        organizationPolicy={null}
        canEdit={true}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Edit refs" }))

    expect(screen.queryByText("Text span quick labels")).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText("Add a label")).not.toBeInTheDocument()
  })
})
