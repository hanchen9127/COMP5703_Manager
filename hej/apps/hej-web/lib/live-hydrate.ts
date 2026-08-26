import { getAuthToken } from "@/lib/api/auth"

export type LiveHydratePhase =
  | "initial-loading"
  | "background-refreshing"
  | "live"
  | "unauthenticated"
  | "not-found"
  | "unreachable"

export const HYDRATE_MAX_ATTEMPTS = 3
export const HYDRATE_RETRY_DELAY_MS = 400

export function resolveLiveHydratePhase(
  apiError: boolean,
  needsHydration: boolean,
): LiveHydratePhase {
  if (needsHydration) {
    return "initial-loading"
  }

  if (!getAuthToken()) {
    return apiError ? "unreachable" : "live"
  }

  return "background-refreshing"
}

export function isBackendBridgeProjectName(name: string, projectId: string): boolean {
  return name === `Backend project ${projectId}`
}

export function isBackendBridgeTaskTitle(title: string, taskId: string): boolean {
  return title === `Backend task ${taskId}`
}

/** e.g. `task_proj_1_1_1` → `proj_1_1` */
export function parseProjectIdFromBackendTaskId(taskId: string): string | null {
  const match = /^task_(proj_\d+_\d+)(?:_|$)/.exec(taskId)
  return match?.[1] ?? null
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
