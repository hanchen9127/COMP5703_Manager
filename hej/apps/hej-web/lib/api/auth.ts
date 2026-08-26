/**
 * Auth API module.
 *
 * Wraps backend endpoints:
 *   POST /auth/login    — exchange email + password for a JWT access token
 *
 * On a successful login, the access token is persisted via the storage helper,
 * and every subsequent `apiClient` call automatically attaches
 * `Authorization: Bearer <token>`. UI components do not need to thread the
 * token through their props.
 *
 * Refresh:
 *   The backend currently exposes `POST /auth/refresh` but returns
 *   `501 Not Implemented`. There is no `refresh_token` on `LoginResponse`
 *   either, so there is no client-side flow we can wire today. When the
 *   backend ships real refresh, add a `refresh()` function here and
 *   trigger it from a 401 interceptor in `client.ts`.
 */
import { apiClient, type ApiResult } from "./client"
import {
  clearStoredOrganizationContexts,
  setStoredOrganizationContexts,
} from "@/lib/auth-organization-context"
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
  type AccessTokenStorageMode,
} from "@/lib/auth-storage"

/** Subset of `UserPublic` from apps/hej-api/app/schemas/auth.py. */
export type ApiAuthUser = {
  user_id: number
  email: string
  name: string
  account_status: string
  two_factor_enabled: boolean
  last_login_at: string | null
}

/** Subset of `OrganizationContext` from the same schema file. */
export type ApiAuthOrganizationContext = {
  organization_id: number
  organization_name: string
  organization_slug: string
  organization_status: string
  membership_status: string
  roles: string[]
  is_admin: boolean
  is_owner: boolean
  members_count: number
  policy: {
    membership_approval_required: boolean
    review_dual_sign_off: boolean
    dispute_escalation_gate: string
    export_provenance_required: boolean
  }
}

/** Matches `LoginResponse` returned by `POST /auth/login`. */
export type ApiLoginResponse = {
  access_token: string
  token_type: string
  user: ApiAuthUser
  organizations: ApiAuthOrganizationContext[]
  message: string
}

/**
 * Log in with the seeded credentials (or any other valid account) and
 * persist the returned JWT. The full `LoginResponse` is returned so the
 * caller can hydrate UI state (current user, org switcher) without a
 * follow-up request.
 */
export async function login(
  email: string,
  password: string,
  options?: { persistence?: AccessTokenStorageMode },
): Promise<ApiResult<ApiLoginResponse>> {
  const result = await apiClient.post<ApiLoginResponse>("/auth/login", {
    email,
    password,
  })
  if (result.ok) {
    setStoredAccessToken(result.data.access_token, { persistence: options?.persistence })
    setStoredOrganizationContexts(result.data.organizations, {
      persistence: options?.persistence,
    })
  }
  return result
}

/** Clear the persisted JWT. Future requests will be sent unauthenticated. */
export function logout(): void {
  clearStoredAccessToken()
  clearStoredOrganizationContexts()
}

export function getAuthToken(): string | null {
  return getStoredAccessToken()
}
