import { getAuthToken } from "@/lib/api/auth"
import { getProject } from "@/lib/api/projects"
import { getTask } from "@/lib/api/tasks"
import { delay, HYDRATE_MAX_ATTEMPTS, HYDRATE_RETRY_DELAY_MS } from "@/lib/live-hydrate"
import type {
  ProjectRouteBreadcrumbLabels,
  TaskRouteBreadcrumbLabels,
} from "@/lib/route-breadcrumb-labels"
import { toProjectRouteBreadcrumbLabels, toTaskRouteBreadcrumbLabels } from "@/lib/route-breadcrumb-labels"

async function waitForAuthToken(): Promise<boolean> {
  for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt += 1) {
    if (getAuthToken()) {
      return true
    }
    if (attempt < HYDRATE_MAX_ATTEMPTS - 1) {
      await delay(HYDRATE_RETRY_DELAY_MS)
    }
  }
  return false
}

export async function fetchProjectRouteBreadcrumbLabels(
  projectId: string,
): Promise<ProjectRouteBreadcrumbLabels | null> {
  if (!(await waitForAuthToken())) {
    return null
  }

  for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt += 1) {
    const projectResult = await getProject(projectId)
    if (projectResult.ok) {
      return toProjectRouteBreadcrumbLabels(projectId, projectResult.data.name ?? projectId)
    }
    if (attempt < HYDRATE_MAX_ATTEMPTS - 1) {
      await delay(HYDRATE_RETRY_DELAY_MS)
    }
  }

  return null
}

export async function fetchTaskRouteBreadcrumbLabels(
  taskId: string,
): Promise<TaskRouteBreadcrumbLabels | null> {
  if (!(await waitForAuthToken())) {
    return null
  }

  for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt += 1) {
    const taskResult = await getTask(taskId)
    if (!taskResult.ok) {
      if (attempt < HYDRATE_MAX_ATTEMPTS - 1) {
        await delay(HYDRATE_RETRY_DELAY_MS)
      }
      continue
    }

    const projectId = taskResult.data.project_id
    const taskTitle = taskResult.data.title ?? taskId

    const projectResult = await getProject(projectId)
    const projectName = projectResult.ok
      ? (projectResult.data.name ?? projectId)
      : projectId

    return toTaskRouteBreadcrumbLabels({
      taskId,
      taskTitle,
      projectId,
      projectName,
    })
  }

  return null
}
