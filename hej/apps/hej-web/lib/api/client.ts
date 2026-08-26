/**
 * Shared frontend API client.
 *
 * Goals:
 * - One place to hold base URL, headers, and error normalization.
 * - UI components never call `fetch` directly. They go through this module
 *   (via the resource-specific modules under `lib/api/`).
 * - Errors are returned as data (`ApiResult`), never thrown to UI.
 * - Reuses the existing `NEXT_PUBLIC_HEJ_API_BASE_URL` via `hejApiBaseUrl`
 *   so we don't introduce a second base-URL convention.
 * - When a JWT access token is present, every request attaches
 *   `Authorization: Bearer …` automatically, so resource modules
 *   (organizations / projects / tasks / task-items) stay auth-agnostic.
 */
import { hejApiBaseUrl } from "@/lib/api-config"
import { getStoredAccessToken } from "@/lib/auth-storage"

export type ApiError = {
  /** HTTP status code, or 0 for network / pre-flight failure. */
  status: number
  /** Best-effort human-readable message (response body text or fetch error). */
  message: string
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  cache?: RequestCache
}

/** Turn FastAPI / plain-text error bodies into a short UI message. */
export function parseApiErrorMessage(body: string, status: number): string {
  const trimmed = body.trim()
  if (!trimmed) {
    if (status === 0) {
      return "Network error. Check that the API is running."
    }
    return `Request failed (${status})`
  }

  try {
    const parsed = JSON.parse(trimmed) as { detail?: unknown }
    if (typeof parsed.detail === "string") {
      return parsed.detail
    }
    if (Array.isArray(parsed.detail)) {
      return parsed.detail
        .map((entry) => {
          if (entry && typeof entry === "object" && "msg" in entry) {
            return String((entry as { msg: unknown }).msg)
          }
          return String(entry)
        })
        .join("; ")
    }
  } catch {
    /* plain text body */
  }

  return trimmed
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const url = `${hejApiBaseUrl}${path}`
  const method = options.method ?? "GET"
  const hasBody = options.body !== undefined && options.body !== null

  const headers: Record<string, string> = {}
  if (hasBody) {
    headers["Content-Type"] = "application/json"
  }
  const token = getStoredAccessToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      cache: options.cache ?? "no-store",
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

    if (response.status === 204) {
      return { ok: true, data: undefined as T }
    }

    const data = (await response.json()) as T
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

export const apiClient = {
  get<T>(path: string, options?: { cache?: RequestCache }) {
    return apiRequest<T>(path, { method: "GET", cache: options?.cache })
  },
  post<T>(path: string, body?: unknown) {
    return apiRequest<T>(path, { method: "POST", body })
  },
  put<T>(path: string, body?: unknown) {
    return apiRequest<T>(path, { method: "PUT", body })
  },
  patch<T>(path: string, body?: unknown) {
    return apiRequest<T>(path, { method: "PATCH", body })
  },
  delete<T>(path: string) {
    return apiRequest<T>(path, { method: "DELETE" })
  },
}
