import type { ApiError } from "@/lib/api/client"
import { getProject } from "@/lib/api/projects"
import { listDraftsForTaskItem, listTaskItems } from "@/lib/api/task-items"
import { getTask } from "@/lib/api/tasks"
import { mapApiProjectToMock, mapApiTaskToMock } from "@/lib/project-data"
import {
  applyApiDraftsToMockItem,
  buildBackendBridgeWorkspaceView,
  mapApiItemToMock,
  type BridgeTaskWorkspaceView,
} from "@/lib/task-workspace-data"

export type TaskWorkspaceView = Omit<BridgeTaskWorkspaceView, "apiError"> & {
  apiError: boolean
}

export type TaskWorkspaceFetchResult =
  | { ok: true; data: TaskWorkspaceView }
  | { ok: false; kind: "not-found" }
  | { ok: false; kind: "api-error"; error: ApiError }

function apiFailure(message: string, status = 0): TaskWorkspaceFetchResult {
  return {
    ok: false,
    kind: "api-error",
    error: { status, message },
  }
}

export function taskWorkspaceSignature(view: TaskWorkspaceView): string {
  const itemStates = [...view.taskItems.map((item) => `${item.id}:${item.status}`)].sort().join(",")
  return [
    view.apiError ? "e" : "ok",
    view.task.id,
    view.task.title,
    view.project.id,
    view.project.name,
    itemStates,
  ].join("|")
}

/**
 * Client-only task workspace fetch (JWT via apiClient). Used after SSR bridge stubs.
 *
 * This repository function returns explicit success/failure results. It must not
 * turn backend/API failures into synthetic domain-shaped workspace data.
 */
export async function fetchLiveTaskWorkspace(
  taskId: string,
): Promise<TaskWorkspaceFetchResult> {
  const seed = buildBackendBridgeWorkspaceView(taskId)

  if (!seed) {
    return { ok: false, kind: "not-found" }
  }

  const taskResult = await getTask(taskId)
  if (!taskResult.ok) {
    return { ok: false, kind: "api-error", error: taskResult.error }
  }

  const [itemsResult, projectResult] = await Promise.all([
    listTaskItems(taskId),
    getProject(taskResult.data.project_id),
  ])

  if (!itemsResult.ok) {
    return { ok: false, kind: "api-error", error: itemsResult.error }
  }
  if (!projectResult.ok) {
    return { ok: false, kind: "api-error", error: projectResult.error }
  }

  try {
    const mappedTask = mapApiTaskToMock(taskResult.data, seed.task)
    const mappedProject = mapApiProjectToMock(projectResult.data)
    const mappedItems = itemsResult.data.map((item) => mapApiItemToMock(taskId, item))
    const taskItems = await Promise.all(
      mappedItems.map(async (item) => {
        const draftResult = await listDraftsForTaskItem(item.id)
        if (!draftResult.ok) {
          return item
        }
        return applyApiDraftsToMockItem(item, draftResult.data.drafts, mappedTask.taskType)
      }),
    )

    return {
      ok: true,
      data: {
        task: mappedTask,
        project: mappedProject,
        taskItems,
        workflow: seed.workflow,
        assignments: seed.assignments,
        activity: seed.activity,
        apiError: false,
      },
    }
  } catch (error) {
    return apiFailure(
      error instanceof Error ? error.message : "Task workspace mapping failed",
    )
  }
}
