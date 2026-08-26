/**
 * Persists organization membership context from login for client-side
 * permission hints (admin / task_owner). Authoritative checks remain on the API.
 */
import type { ApiAuthOrganizationContext } from "@/lib/api/auth"

const ORGANIZATION_CONTEXTS_KEY = "hej.auth.organization_contexts"

function getAllStorages(): Array<Storage | null> {
  if (typeof window === "undefined") return [null, null]
  return [window.localStorage, window.sessionStorage]
}

export function getStoredOrganizationContexts(): ApiAuthOrganizationContext[] {
  if (typeof window === "undefined") return []

  for (const storage of getAllStorages()) {
    try {
      const raw = storage?.getItem(ORGANIZATION_CONTEXTS_KEY)
      if (!raw) continue
      const parsed = JSON.parse(raw) as ApiAuthOrganizationContext[]
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      /* try next storage */
    }
  }
  return []
}

export function setStoredOrganizationContexts(
  contexts: ApiAuthOrganizationContext[],
  options?: { persistence?: "localStorage" | "sessionStorage" },
): void {
  if (typeof window === "undefined") return

  const mode = options?.persistence ?? "localStorage"
  const primary =
    mode === "localStorage" ? window.localStorage : window.sessionStorage
  const secondary =
    mode === "localStorage" ? window.sessionStorage : window.localStorage
  const payload = JSON.stringify(contexts)

  try {
    primary.setItem(ORGANIZATION_CONTEXTS_KEY, payload)
    secondary.removeItem(ORGANIZATION_CONTEXTS_KEY)
  } catch {
    /* non-fatal */
  }
}

export function clearStoredOrganizationContexts(): void {
  if (typeof window === "undefined") return

  for (const storage of getAllStorages()) {
    try {
      storage?.removeItem(ORGANIZATION_CONTEXTS_KEY)
    } catch {
      /* non-fatal */
    }
  }
}

function findOrganizationContext(
  organizationId: string,
): ApiAuthOrganizationContext | null {
  const normalized = String(organizationId)
  return (
    getStoredOrganizationContexts().find(
      (item) => String(item.organization_id) === normalized,
    ) ?? null
  )
}

export function canEditOrganizationPolicy(organizationId: string): boolean {
  const context = findOrganizationContext(organizationId)
  if (!context) return false
  return context.is_admin || context.is_owner
}

export function canEditTaskPolicy(organizationId: string): boolean {
  const context = findOrganizationContext(organizationId)
  if (!context) return false
  if (context.is_admin || context.is_owner) return true
  return context.roles.includes("task_owner") || context.roles.includes("admin")
}
