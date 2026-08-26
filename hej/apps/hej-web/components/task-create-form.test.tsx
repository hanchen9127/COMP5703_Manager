import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { createTask } from "@/lib/api/tasks"
import {
  getDefaultTextSpanLabelOptions,
  getInitialTextSpanLabelOptions,
  normalizeInitialTextSpanLabelOptions,
  TaskCreateForm,
} from "./task-create-form"
import type { MockProject } from "@/lib/domain/project-types"

const pushMock = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock("@/lib/api/tasks", () => ({
  createTask: vi.fn(),
}))

const mockedCreateTask = vi.mocked(createTask)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const project = {
  id: "project-1",
  organizationId: "org-1",
  name: "Project",
  description: "Project description",
  governanceModel: "standard",
  status: "active",
} satisfies MockProject

function moveToLaunchStep() {
  for (let i = 0; i < 3; i += 1) {
    fireEvent.click(screen.getByRole("button", { name: "Next step" }))
  }
}

describe("task create text span label initialization", () => {
  it("uses persisted annotation labels when present", () => {
    expect(
      getInitialTextSpanLabelOptions("annotation", {
        annotation: [" entailment ", "neutral"],
      }),
    ).toEqual(["entailment", "neutral"])
  })

  it("uses persisted judgement labels when present", () => {
    expect(
      getInitialTextSpanLabelOptions("judgement", {
        judgement: [" pass ", "needs_work"],
      }),
    ).toEqual(["pass", "needs_work"])
  })

  it("falls back to defaults when config is missing", () => {
    expect(getInitialTextSpanLabelOptions("annotation")).toEqual(
      getDefaultTextSpanLabelOptions("annotation"),
    )
  })

  it("falls back to defaults when labels are empty", () => {
    expect(getInitialTextSpanLabelOptions("judgement", { judgement: [] })).toEqual(
      getDefaultTextSpanLabelOptions("judgement"),
    )
  })

  it("rejects invalid persisted labels without crashing callers", () => {
    expect(normalizeInitialTextSpanLabelOptions(["duplicate", " Duplicate "])).toBeNull()
    expect(
      getInitialTextSpanLabelOptions("annotation", {
        annotation: ["duplicate", " Duplicate "],
      }),
    ).toEqual(getDefaultTextSpanLabelOptions("annotation"))
  })

  it("does not overwrite dirty labels on task class change", () => {
    render(
      <TaskCreateForm
        project={project}
        initialTextSpanLabelOptions={{
          annotation: ["persisted_annotation"],
          judgement: ["persisted_judgement"],
        }}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /Shared rules/ }))

    expect(screen.getByText("persisted_annotation")).toBeInTheDocument()

    const input = screen.getByPlaceholderText("Add a label")
    fireEvent.change(input, { target: { value: "custom_dirty" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(screen.getByText("custom_dirty")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Task class" }))
    fireEvent.click(screen.getByRole("button", { name: /Judgement Evaluate/ }))
    fireEvent.click(screen.getByRole("button", { name: /Shared rules/ }))

    expect(screen.getByText("custom_dirty")).toBeInTheDocument()
    expect(screen.queryByText("persisted_judgement")).not.toBeInTheDocument()
  })
})

describe("task create submit payload text span labels", () => {
  it("submits persisted quick labels in text_span_label_options", async () => {
    mockedCreateTask.mockResolvedValueOnce({
      ok: true,
      data: { id: "task-new-1" },
    } as Awaited<ReturnType<typeof createTask>>)

    render(
      <TaskCreateForm
        project={project}
        initialTextSpanLabelOptions={{
          annotation: ["persisted_annotation"],
        }}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Next step" }))
    fireEvent.change(screen.getByPlaceholderText("Enter a task title"), {
      target: { value: "Task title" },
    })
    fireEvent.change(screen.getByPlaceholderText("Describe what the task should accomplish"), {
      target: { value: "Task objective" },
    })

    moveToLaunchStep()

    fireEvent.click(screen.getByRole("button", { name: "Create Task Draft" }))

    await waitFor(() => {
      expect(mockedCreateTask).toHaveBeenCalled()
    })

    expect(mockedCreateTask).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({
        text_span_label_options: ["persisted_annotation"],
      }),
    )
  })

  it("submits user-added quick labels in text_span_label_options", async () => {
    mockedCreateTask.mockResolvedValueOnce({
      ok: true,
      data: { id: "task-new-2" },
    } as Awaited<ReturnType<typeof createTask>>)

    render(
      <TaskCreateForm
        project={project}
        initialTextSpanLabelOptions={{
          annotation: ["persisted_annotation"],
        }}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /Shared rules/ }))
    const input = screen.getByPlaceholderText("Add a label")
    fireEvent.change(input, { target: { value: "custom_label" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    fireEvent.click(screen.getByRole("button", { name: "Task type" }))
    fireEvent.change(screen.getByPlaceholderText("Enter a task title"), {
      target: { value: "Task title" },
    })
    fireEvent.change(screen.getByPlaceholderText("Describe what the task should accomplish"), {
      target: { value: "Task objective" },
    })

    moveToLaunchStep()

    fireEvent.click(screen.getByRole("button", { name: "Create Task Draft" }))

    await waitFor(() => {
      expect(mockedCreateTask).toHaveBeenCalled()
    })

    expect(mockedCreateTask).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({
        text_span_label_options: ["persisted_annotation", "custom_label"],
      }),
    )
  })
})
