import {
  getOrganizationDetail,
  listOrganizations,
  type ApiOrganization,
  type ApiOrganizationDetail,
  type ApiOrganizationPolicy,
} from "@/lib/api/organizations"
import {
  getProject,
  listProjects,
  type ApiProject,
} from "@/lib/api/projects"
import {
  getProjectPolicies,
  resolvedPoliciesByTaskId,
  type ApiResolvedPolicy,
} from "@/lib/api/policies"
import { getProjectDisputes, type ApiDisputeCase } from "@/lib/api/disputes"
import { getProjectExports, type ApiExportPackage } from "@/lib/api/exports"
import { getAuthToken } from "@/lib/api/auth"
import { getTaskSetup } from "@/lib/api/task-setup"
import { listTaskItems } from "@/lib/api/task-items"
import { listTasks, type ApiTask } from "@/lib/api/tasks"
import type { GovernanceModel } from "@/lib/governance-model"
import { governanceModelOptions } from "@/lib/governance-model"
import { TASK_STATUS, type MockTaskStatus } from "@/lib/domain/task-status"

import type { MockTask, MockTaskType } from "@/lib/domain/task-types"
import type { MockOrganization, MockProject } from "@/lib/domain/project-types"
import type { MockDisputeCase, MockExportPackage } from "@/lib/domain/case-types"

const VALID_GOVERNANCE_MODELS = new Set<string>(
  governanceModelOptions.map((option) => option.value)
)

export function mapApiOrganizationDetailToMock(
  organization: ApiOrganizationDetail,
): MockOrganization {
  return mapApiOrganizationToMock(organization)
}

// UI/display formatting shim: Mock* types still require string display names.
export function formatOrganizationDisplayName(value: string | null | undefined): string {
  return value != null && String(value).trim() !== ""
    ? String(value).trim()
    : "Untitled organization"
}

export function formatProjectDisplayName(value: string | null | undefined): string {
  return value != null && String(value).trim() !== ""
    ? String(value).trim()
    : "Untitled project"
}

export function formatTaskTitle(value: string | null | undefined): string {
  return value != null && String(value).trim() !== ""
    ? String(value).trim()
    : "Untitled task"
}

export function mapApiOrganizationToMock(organization: ApiOrganization): MockOrganization {
  const status =
    organization.status != null && String(organization.status).trim() !== ""
      ? String(organization.status).trim()
      : "unknown"
  return {
    id: String(organization.id ?? "unknown_org"),
    displayName: formatOrganizationDisplayName(organization.name),
    status,
  }
}

export function mapApiProjectToMock(project: ApiProject): MockProject {
  const rawGm = project.governance_model
  let governanceModel: GovernanceModel = "standard"
  if (rawGm != null && VALID_GOVERNANCE_MODELS.has(String(rawGm))) {
    governanceModel = rawGm as GovernanceModel
  } else if (rawGm != null && String(rawGm).trim() !== "") {
    console.warn("Unknown governance model from API:", rawGm)
  }

  const status =
    project.status != null && String(project.status).trim() !== ""
      ? String(project.status).trim()
      : "unknown"

  return {
    id: String(project.id),
    organizationId: String(project.organization_id ?? ""),
    name: formatProjectDisplayName(project.name),
    description: project.description ?? "",
    governanceModel,
    status,
  }
}

function normalizeMockTaskType(value: unknown): MockTaskType | null {
  return value === "image" || value === "text" || value === "audio" ? value : null
}

function normalizeApiTaskTextSpanLabelOptions(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null

  const labels = value
    .filter((label): label is string => typeof label === "string")
    .map((label) => label.trim())
    .filter((label) => label.length > 0)

  return labels.length > 0 ? labels : null
}

// Legacy description parsing keeps older bridged tasks readable.
function parseTaskDescription(raw: string | null | undefined): {
  taskClass: MockTask["taskClass"]
  parsedTaskSubtype: string | null
} {
  const [rawClass, rawType] = (raw ?? "").split("/").map((part) => part.trim())
  const taskClass = rawClass === "judgement" ? "judgement" : "annotation"
  return {
    taskClass,
    parsedTaskSubtype: rawType && rawType.length > 0 ? rawType : null,
  }
}

function resolveTaskSubtype(
  parsedTaskSubtype: string | null,
  fallback?: MockTask
): string | undefined {
  return parsedTaskSubtype ?? fallback?.taskSubtype
}

function resolveTaskType(task: ApiTask, fallback?: MockTask): MockTaskType {
  const fallbackTaskType = normalizeMockTaskType(fallback?.taskType)
  const rawTaskType = normalizeMockTaskType(task.task_type)

  if (rawTaskType) return rawTaskType
  if (fallbackTaskType) return fallbackTaskType

  throw new Error(`Unknown task_type from API: ${String(task.task_type)}`)
}

async function resolveTaskBacklogCount(taskId: string, fallback?: MockTask): Promise<number> {
  const setupResult = await getTaskSetup(taskId)
  if (setupResult.ok) {
    return setupResult.data.data_plane.item_count
  }

  const itemsResult = await listTaskItems(taskId)
  if (itemsResult.ok) {
    return itemsResult.data.length
  }

  return fallback?.backlogCount ?? 0
}

function mapApiTaskStatus(status: ApiTask["status"]): MockTaskStatus {
  switch (status) {
    case "draft":
      return TASK_STATUS.DRAFT
    case "ready":
      return TASK_STATUS.ACTIVE
    case "in_review":
    case "disputed":
      return TASK_STATUS.UNDER_REVIEW
    case "completed":
      return TASK_STATUS.PILOT
  }
}

export function mapApiDisputeCaseToMock(d: ApiDisputeCase): MockDisputeCase {
  return {
    id: d.id,
    taskId: d.task_id,
    taskItemId: d.task_item_id,
    status: d.status,
    severity: d.severity,
    openedBy: d.opened_by,
    assignedTo: d.assigned_to,
    disagreementSummary: d.disagreement_summary,
  }
}

export function mapApiExportPackageToMock(e: ApiExportPackage): MockExportPackage {
  return {
    id: e.id,
    organizationId: "",
    projectId: e.project_id,
    taskId: e.task_id,
    status: e.status,
    format: e.format,
    itemCount: e.item_count,
    completedItemCount: e.completed_item_count,
    includesProvenance: e.includes_provenance,
    destination: e.destination,
    exportScope: e.export_scope,
    isFullProjectReady: e.is_full_project_ready,
    finalizedItemCount: e.finalized_item_count,
    totalItemCount: e.total_item_count,
  }
}

export function mapApiTaskToMock(
  task: ApiTask,
  fallback?: MockTask,
  backlogCountOverride?: number,
): MockTask {
  const { taskClass, parsedTaskSubtype } = parseTaskDescription(task.description)
  const taskSubtype = resolveTaskSubtype(parsedTaskSubtype, fallback)
  const textSpanLabelOptions =
    normalizeApiTaskTextSpanLabelOptions(task.text_span_label_options) ??
    fallback?.textSpanLabelOptions ??
    null

  return {
    id: String(task.id),
    projectId: String(task.project_id),
    title: formatTaskTitle(task.title),
    judgmentQuestion: task.judgment_question?.trim() || fallback?.judgmentQuestion || "",
    taskClass,
    taskType: resolveTaskType(task, fallback),
    ...(taskSubtype ? { taskSubtype } : {}),
    executionMode: task.annotation_mode,
    dataSourceLabel: fallback?.dataSourceLabel ?? "Backend task data",
    annotationRules: fallback?.annotationRules ?? task.description ?? "",
    outputSchemaRef: task.label_schema_ref,
    textSpanLabelOptions,
    reviewPolicyRef: task.review_policy_ref ?? fallback?.reviewPolicyRef ?? "standard-review",
    disputePolicyRef: task.dispute_policy_ref ?? fallback?.disputePolicyRef ?? null,
    exportPolicyRef: task.export_policy_ref ?? fallback?.exportPolicyRef ?? null,
    status: mapApiTaskStatus(task.status),
    backlogCount: backlogCountOverride ?? fallback?.backlogCount ?? 0,
  }
}

function getProjectWorkspaceShell(projectId: string) {
  return {
    organization: {
      id: "unknown_org",
      displayName: "Backend organization",
      status: "unknown",
    },
    project: {
      id: projectId,
      organizationId: "unknown_org",
      name: "Project workspace",
      description: "Connect to the backend with a valid token to load this project.",
      governanceModel: "standard" as GovernanceModel,
      status: "unknown",
    },
    tasks: [],
    disputes: [],
    exports: [],
    organizationPolicy: null,
    resolvedPoliciesByTaskId: {},
    apiError: true,
  }
}

// Mirrors the task bridge heuristic so malformed project URLs still 404.
function looksLikeProjectId(projectId: string): boolean {
  return projectId.startsWith("proj_") && projectId.length > "proj_".length
}

/**
 * Backend-only project bridge.
 * Kept outside `getProjectWorkspaceView` so unrelated child routes can
 * preserve their existing `notFound()` behavior for backend-only IDs.
 */
export function buildBackendBridgeProjectView(projectId: string) {
  if (!looksLikeProjectId(projectId)) return null
  const shell = getProjectWorkspaceShell(projectId)
  return {
    ...shell,
    project: {
      ...shell.project,
      name: `Backend project ${projectId}`,
      description:
        "Workspace stub for a backend-only project ID. Real data is hydrated on the client when an auth token is present.",
    },
    apiError: false as const,
  }
}

export async function getProjectsOverviewData() {
  if (typeof window === "undefined" && !getAuthToken()) {
    return {
      organizations: [],
      projects: [],
      tasks: [],
      apiError: false,
    }
  }

  try {
    const organizationsResult = await listOrganizations()

    if (!organizationsResult.ok) {
      throw new Error(`Organizations API request failed: ${organizationsResult.error.status}`)
    }

    const organizations = organizationsResult.data.map(mapApiOrganizationToMock)

    const projectGroups = await Promise.all(
      organizations.map(async (organization) => {
        const result = await listProjects(organization.id)
        if (!result.ok) {
          throw new Error(`Projects API request failed: ${result.error.status}`)
        }
        return result.data
      })
    )

    const projects = projectGroups.flat().map(mapApiProjectToMock)

    const taskGroups = await Promise.all(
      projects.map(async (project) => {
        const result = await listTasks(project.id)
        if (!result.ok) {
          throw new Error(`Tasks API request failed: ${result.error.status}`)
        }
        return result.data
      })
    )
    const tasks = await Promise.all(
      taskGroups.flat().map(async (task) => {
        const backlogCount = await resolveTaskBacklogCount(String(task.id))
        return mapApiTaskToMock(task, undefined, backlogCount)
      })
    )

    return {
      organizations,
      projects,
      tasks,
      apiError: false,
    }
  } catch (error) {
    console.warn("[project-data] projects overview hydration failed", {
      error,
    })

    return {
      organizations: [],
      projects: [],
      tasks: [],
      apiError: true,
    }
  }
}

export type ProjectsOverviewData = Awaited<ReturnType<typeof getProjectsOverviewData>>

/**
 * Cheap stable fingerprint for client-side refresh: skip `setState` when the
 * merged portfolio is unchanged or when Strict Mode runs the effect twice.
 */
export function projectsOverviewSignature(view: ProjectsOverviewData): string {
  const orgIds = [...view.organizations.map((item) => item.id)].sort().join(",")
  const projectIds = [...view.projects.map((item) => item.id)].sort().join(",")
  const taskIds = [...view.tasks.map((item) => item.id)].sort().join(",")
  const taskStatuses = [...view.tasks.map((item) => item.status)].join(",")
  const perProjectCounts = [...new Map(view.tasks.map((task) => [task.projectId, 0]))]
    .map(([projectId]) => {
      const count = view.tasks.filter((task) => task.projectId === projectId).length
      return `${projectId}:${count}`
    })
    .sort()
    .join(",")
  const backlog = [...view.tasks.map((item) => item.backlogCount ?? 0)].join(",")
  return [view.apiError ? "e" : "ok", orgIds, projectIds, taskIds, taskStatuses, perProjectCounts, backlog].join("|")
}

async function resolveOrganizationPolicy(
  organizationId: string,
): Promise<{
  organization: MockOrganization | null
  organizationPolicy: ApiOrganizationPolicy | null
}> {
  const routeValue = organizationId.trim()
  const apiId = /^\d+$/.test(routeValue)
    ? Number(routeValue)
    : await (async () => {
        const listResult = await listOrganizations()
        if (!listResult.ok) {
          return null
        }

        const summary = listResult.data.find((item) => {
          const candidates = [String(item.id), item.slug, `org_${item.slug}`, `org_${item.id}`]
          return candidates.includes(routeValue)
        })

        return summary ? Number(summary.id) : null
      })()

  if (apiId == null) {
    return { organization: null, organizationPolicy: null }
  }

  const detailResult = await getOrganizationDetail(apiId)
  if (detailResult.ok && detailResult.data.policy?.id != null) {
    return {
      organization: mapApiOrganizationDetailToMock(detailResult.data),
      organizationPolicy: detailResult.data.policy,
    }
  }

  const listResult = await listOrganizations()
  if (!listResult.ok) {
    return { organization: null, organizationPolicy: null }
  }

  const summary = listResult.data.find((item) => Number(item.id) === apiId)
  if (!summary) {
    return { organization: null, organizationPolicy: null }
  }

  return {
    organization: mapApiOrganizationToMock(summary),
    organizationPolicy: null,
  }
}

export async function getProjectWorkspaceView(projectId: string) {
  const bridge = buildBackendBridgeProjectView(projectId)

  if (typeof window === "undefined" && bridge && !getAuthToken()) {
    return bridge
  }

  if (typeof window === "undefined" && !getAuthToken()) {
    return null
  }

  try {
    const [projectResult, policiesResult, disputesResult, exportsResult] = await Promise.all([
      getProject(projectId),
      getProjectPolicies(projectId),
      getProjectDisputes(projectId),
      getProjectExports(projectId),
    ])

    if (!projectResult.ok) {
      throw new Error(`Project API request failed: ${projectResult.error.status}`)
    }

    const mappedProject = mapApiProjectToMock(projectResult.data)

    const liveDisputes = disputesResult.ok
      ? disputesResult.data.map(mapApiDisputeCaseToMock)
      : []

    const liveExports = exportsResult.ok
      ? exportsResult.data.map(mapApiExportPackageToMock)
      : []

    const shell = getProjectWorkspaceShell(projectId)
    const organizationFromPolicy = await resolveOrganizationPolicy(mappedProject.organizationId)
    const organization = organizationFromPolicy.organization ?? shell.organization

    let tasks: MockTask[] = []
    let organizationPolicy = organizationFromPolicy.organizationPolicy
    let resolvedPolicies: Record<string, ApiResolvedPolicy> = {}

    if (policiesResult.ok) {
      const aggregate = policiesResult.data
      organizationPolicy = aggregate.organization_policy ?? organizationFromPolicy.organizationPolicy
      resolvedPolicies = resolvedPoliciesByTaskId(aggregate)
      tasks = await Promise.all(
        aggregate.tasks.map(async (entry) => {
          const backlogCount = await resolveTaskBacklogCount(String(entry.task.id))
          return mapApiTaskToMock(entry.task, undefined, backlogCount)
        })
      )
    } else {
      const tasksResult = await listTasks(projectId)
      if (tasksResult.ok) {
        tasks = await Promise.all(
          tasksResult.data.map(async (task) => {
            const backlogCount = await resolveTaskBacklogCount(String(task.id))
            return mapApiTaskToMock(task, undefined, backlogCount)
          })
        )
      }
    }

    return {
      organization,
      project: mappedProject,
      tasks,
      disputes: liveDisputes,
      exports: liveExports,
      organizationPolicy,
      resolvedPoliciesByTaskId: resolvedPolicies,
      apiError: false,
    }
  } catch (error) {
    console.warn("[project-data] project workspace hydration failed", {
      projectId,
      error,
    })

    if (!bridge) {
      return null
    }

    return {
      ...bridge,
      apiError: true,
    }
  }
}

export type ProjectWorkspaceView = {
  organization: MockOrganization
  project: MockProject
  tasks: MockTask[]
  disputes: MockDisputeCase[]
  exports: MockExportPackage[]
  organizationPolicy: ApiOrganizationPolicy | null
  resolvedPoliciesByTaskId: Record<string, ApiResolvedPolicy>
  apiError: boolean
}

function organizationPolicySignature(policy: ApiOrganizationPolicy | null): string {
  if (!policy) {
    return "no-policy"
  }
  return [
    policy.dispute_escalation_gate,
    policy.dispute_escalation_threshold,
    policy.export_provenance_required,
    policy.export_retention_days,
    policy.review_dual_sign_off,
    policy.review_auto_escalate_disagreement,
    policy.membership_approval_required,
    policy.annotation_mode,
  ].join(",")
}

export function projectWorkspaceSignature(view: ProjectWorkspaceView): string {
  const taskIds = [...view.tasks.map((task) => task.id)].sort().join(",")
  const taskPolicyRefs = view.tasks
    .map(
      (task) =>
        `${task.id}:${task.reviewPolicyRef}:${task.disputePolicyRef ?? ""}:${task.exportPolicyRef ?? ""}`,
    )
    .sort()
    .join(";")
  const disputeStates = [...view.disputes.map((d) => `${d.id}:${d.status}:${d.severity}`)]
    .sort()
    .join(",")
  const exportStates = [...view.exports.map((e) => `${e.id}:${e.status}:${e.completedItemCount}`)]
    .sort()
    .join(",")
  return [
    view.apiError ? "e" : "ok",
    view.project.id,
    view.project.name,
    view.organization.id,
    organizationPolicySignature(view.organizationPolicy),
    taskIds,
    taskPolicyRefs,
    disputeStates,
    exportStates,
  ].join("|")
}
