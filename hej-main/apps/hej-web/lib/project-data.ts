import { hejApiBaseUrl } from "@/lib/api-config"
import {
  getProjectView as getMockProjectView,
  getProjectsOverviewView as getMockProjectsOverviewView,
  type MockOrganization,
  type MockProject,
  type MockTask,
} from "@/lib/mock-data"

type ApiOrganization = {
  id: string
  display_name: string
  status: string
}

type ApiProject = {
  id: string
  organization_id: string
  name: string
  description: string | null
  governance_model: MockProject["governanceModel"]
  status: string
}

type ApiTask = {
  id: string
  project_id: string
  title: string
  judgment_question: string
  annotation_mode: MockTask["executionMode"]
  label_schema_ref: string
  review_policy_ref: string | null
  status: string
}

async function fetchApiJson<T>(path: string): Promise<T> {
  const response = await fetch(`${hejApiBaseUrl}${path}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

function mapOrganization(organization: ApiOrganization): MockOrganization {
  return {
    id: organization.id,
    displayName: organization.display_name,
    status: organization.status,
  }
}

function mapProject(project: ApiProject): MockProject {
  return {
    id: project.id,
    organizationId: project.organization_id,
    name: project.name,
    description: project.description ?? "",
    governanceModel: project.governance_model,
    status: project.status,
  }
}

function mapTask(task: ApiTask): MockTask {
  return {
    id: task.id,
    projectId: task.project_id,
    title: task.title,
    judgmentQuestion: task.judgment_question,
    taskClass: "annotation",
    taskType: "",
    executionMode: task.annotation_mode,
    dataSourceLabel: "",
    annotationRules: "",
    outputSchemaRef: task.label_schema_ref,
    reviewPolicyRef: task.review_policy_ref ?? "",
    status: task.status,
  }
}

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]) {
  const merged = new Map(primary.map((item) => [item.id, item]))

  for (const item of fallback) {
    if (!merged.has(item.id)) {
      merged.set(item.id, item)
    }
  }

  return Array.from(merged.values())
}

export async function getProjectsOverviewData() {
  const fallback = getMockProjectsOverviewView()

  try {
    const organizations = (await fetchApiJson<ApiOrganization[]>("/organizations")).map(
      mapOrganization
    )

    const projectGroups = await Promise.all(
      organizations.map((organization) =>
        fetchApiJson<ApiProject[]>(`/organizations/${organization.id}/projects`)
      )
    )

    const projects = projectGroups.flat().map(mapProject)

    return {
      ...fallback,
      organizations: mergeById(organizations, fallback.organizations),
      projects: mergeById(projects, fallback.projects),
    }
  } catch {
    return fallback
  }
}

export async function getProjectWorkspaceView(projectId: string) {
  const fallback = getMockProjectView(projectId)

  try {
    const [project, organizations, tasks] = await Promise.all([
      fetchApiJson<ApiProject>(`/projects/${projectId}`),
      fetchApiJson<ApiOrganization[]>("/organizations"),
      fetchApiJson<ApiTask[]>(`/projects/${projectId}/tasks`),
    ])

    const mappedProject = mapProject(project)
    const mappedOrganizations = organizations.map(mapOrganization)
    const organization =
      mappedOrganizations.find((item) => item.id === mappedProject.organizationId) ??
      fallback?.organization

    if (!organization) {
      return null
    }

    return {
      organization,
      project: mappedProject,
      tasks: mergeById(tasks.map(mapTask), fallback?.tasks ?? []),
      disputes: fallback?.disputes ?? [],
      exports: fallback?.exports ?? [],
    }
  } catch {
    return fallback
  }
}
