import { describe, expect, it } from "vitest"

import type { ApiOrganization } from "@/lib/api/organizations"
import type { ApiProject } from "@/lib/api/projects"
import type { ApiTask } from "@/lib/api/tasks"
import {
  formatOrganizationDisplayName,
  formatProjectDisplayName,
  formatTaskTitle,
  mapApiOrganizationToMock,
  mapApiProjectToMock,
  mapApiTaskToMock,
} from "./project-data"

const organization = {
  id: 1,
  name: "Organization",
  slug: "org",
  description: null,
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  members_count: 0,
  admin_count: 0,
} satisfies ApiOrganization

const project = {
  id: "project-1",
  organization_id: "org-1",
  name: "Project",
  description: null,
  governance_model: "standard",
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  created_by: null,
  updated_at: null,
  updated_by: null,
} satisfies ApiProject

const task = {
  id: "task-1",
  project_id: "project-1",
  title: "Task",
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
} satisfies ApiTask

describe("project data display formatting helpers", () => {
  it("formats missing organization name with the existing UI placeholder", () => {
    expect(formatOrganizationDisplayName("")).toBe("Untitled organization")
  })

  it("formats missing project name with the existing UI placeholder", () => {
    expect(formatProjectDisplayName("   ")).toBe("Untitled project")
  })

  it("formats missing task title with the existing UI placeholder", () => {
    expect(formatTaskTitle("")).toBe("Untitled task")
  })
})

describe("project data mapper current bridge defaults", () => {
  it("currently delegates missing organization name formatting to a named display helper", () => {
    const mapped = mapApiOrganizationToMock({
      ...organization,
      name: "",
    })

    expect(mapped.displayName).toBe(formatOrganizationDisplayName(""))
  })

  it("currently delegates missing project name formatting to a named display helper", () => {
    const mapped = mapApiProjectToMock({
      ...project,
      name: "   ",
    })

    expect(mapped.name).toBe(formatProjectDisplayName("   "))
  })

  it("currently delegates missing task title formatting to a named display helper", () => {
    const mapped = mapApiTaskToMock({
      ...task,
      title: "",
    })

    expect(mapped.title).toBe(formatTaskTitle(""))
  })

  it("currently defaults missing review policy to standard-review; should move to explicit policy resolution later", () => {
    const mapped = mapApiTaskToMock({
      ...task,
      review_policy_ref: null,
    })

    expect(mapped.reviewPolicyRef).toBe("standard-review")
  })

  it("currently defaults missing backlog to 0; should move to view model layer", () => {
    const mapped = mapApiTaskToMock(task)

    expect(mapped.backlogCount).toBe(0)
  })
})

describe("mapApiTaskToMock text span label options", () => {
  it("normalizes custom text span labels from the live API task response", () => {
    const mapped = mapApiTaskToMock({
      ...task,
      text_span_label_options: ["claim", " evidence ", "", "risk"],
    })

    expect(mapped.textSpanLabelOptions).toEqual(["claim", "evidence", "risk"])
  })

  it("falls back to the seed task labels when the live API labels are empty", () => {
    const mapped = mapApiTaskToMock(
      {
        ...task,
        text_span_label_options: [],
      },
      {
        id: "task_live_1",
        projectId: "proj_live_1",
        title: "Fallback task",
        judgmentQuestion: "Annotate this item",
        taskClass: "annotation",
        taskType: "text",
        executionMode: "human_first",
        dataSourceLabel: "Fallback data",
        annotationRules: "",
        outputSchemaRef: "schema-1",
        textSpanLabelOptions: ["claim", "evidence"],
        reviewPolicyRef: "review-1",
        disputePolicyRef: null,
        exportPolicyRef: null,
        status: "active",
        backlogCount: 0,
      },
    )

    expect(mapped.textSpanLabelOptions).toEqual(["claim", "evidence"])
  })

  it("uses null when the live API labels are invalid and no fallback labels exist", () => {
    const mapped = mapApiTaskToMock({
      ...task,
      text_span_label_options: ["", "   "] as string[],
    })

    expect(mapped.textSpanLabelOptions).toBeNull()
  })
})

