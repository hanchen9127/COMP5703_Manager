
import type { ProjectsOverviewData } from "@/lib/project-data"
import type { MockTask } from "@/lib/domain/task-types"
import type { MockOrganization, MockProject } from "@/lib/domain/project-types"

/**
 * Picks org / project / task for the home dashboard deep links.
 * Prefers backend-shaped project ids (e.g. proj_1_1) when present so the
 * hero matches the seeded API portfolio after client-side refresh.
 */
export function pickDashboardSpotlight(view: ProjectsOverviewData): {
  organization: MockOrganization
  project: MockProject
  task: MockTask
} | null {
  const { projects, organizations, tasks } = view
  if (projects.length === 0 || organizations.length === 0) {
    return null
  }

  const preferredProject =
    projects.find((project) => /^proj_\d+_\d+$/.test(project.id)) ?? projects[0]

  if (!preferredProject) {
    return null
  }

  const organization =
    organizations.find((item) => item.id === preferredProject.organizationId) ??
    organizations[0]

  const task =
    tasks.find((item) => item.projectId === preferredProject.id) ??
    tasks[0]

  if (!organization || !preferredProject || !task) {
    return null
  }

  return { organization, project: preferredProject, task }
}
