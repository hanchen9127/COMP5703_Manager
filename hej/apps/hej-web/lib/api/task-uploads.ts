import { hejApiBaseUrl } from "@/lib/api-config"
import { getStoredAccessToken } from "@/lib/auth-storage"
import { parseApiErrorMessage, type ApiResult } from "./client"
import type { ApiTaskType } from "./tasks"

export type TaskFileUploadResponse = {
  status: string
  message: string
  created_task_items: number
  created_data_pointers: number
}

export async function uploadTaskFiles(
  taskId: string,
  taskType: ApiTaskType,
  files: File[],
): Promise<ApiResult<TaskFileUploadResponse>> {
  if (files.length === 0) {
    return { ok: false, error: { status: 400, message: "Select at least one file." } }
  }

  const endpoint =
    taskType === "image"
      ? `/tasks/${taskId}/upload-images`
      : taskType === "audio"
        ? `/tasks/${taskId}/upload-audio`
        : `/tasks/${taskId}/upload-texts`

  const formData = new FormData()
  for (const file of files) {
    formData.append("files", file)
  }

  const headers: Record<string, string> = {}
  const token = getStoredAccessToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${hejApiBaseUrl}${endpoint}`, {
      method: "POST",
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: formData,
      cache: "no-store",
    })

    if (!response.ok) {
      const raw = await response.text().catch(() => response.statusText)
      return {
        ok: false,
        error: {
          status: response.status,
          message: parseApiErrorMessage(raw, response.status),
        },
      }
    }

    const data = (await response.json()) as TaskFileUploadResponse
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: {
        status: 0,
        message: error instanceof Error ? error.message : "Network error",
      },
    }
  }
}
