import {
  isBackendBridgeProjectName,
  isBackendBridgeTaskTitle,
} from "@/lib/live-hydrate"

export type ProjectRouteBreadcrumbLabels = {
  projectId: string
  projectName: string
}

export type TaskRouteBreadcrumbLabels = {
  projectId: string
  projectName: string
  taskId: string
  taskTitle: string
}

const BRIDGE_TASK_WORKSPACE_PROJECT_NAME = "Real backend"

export function isDisplayableProjectName(name: string, projectId: string): boolean {
  const trimmed = name.trim()
  if (!trimmed) {
    return false
  }
  if (trimmed === projectId) {
    return false
  }
  if (isBackendBridgeProjectName(trimmed, projectId)) {
    return false
  }
  if (trimmed === BRIDGE_TASK_WORKSPACE_PROJECT_NAME) {
    return false
  }
  return true
}

export function isDisplayableTaskTitle(title: string, taskId: string): boolean {
  const trimmed = title.trim()
  if (!trimmed) {
    return false
  }
  if (trimmed === taskId) {
    return false
  }
  if (isBackendBridgeTaskTitle(trimmed, taskId)) {
    return false
  }
  return true
}

export function toProjectRouteBreadcrumbLabels(
  projectId: string,
  projectName: string,
): ProjectRouteBreadcrumbLabels | null {
  if (!isDisplayableProjectName(projectName, projectId)) {
    return null
  }
  return { projectId, projectName: projectName.trim() }
}

export function toTaskRouteBreadcrumbLabels(input: {
  taskId: string
  taskTitle: string
  projectId: string
  projectName: string
}): TaskRouteBreadcrumbLabels | null {
  const { taskId, taskTitle, projectId, projectName } = input
  if (!isDisplayableTaskTitle(taskTitle, taskId)) {
    return null
  }
  const resolvedProjectName = isDisplayableProjectName(projectName, projectId)
    ? projectName.trim()
    : projectId
  return {
    taskId,
    taskTitle: taskTitle.trim(),
    projectId,
    projectName: resolvedProjectName,
  }
}
