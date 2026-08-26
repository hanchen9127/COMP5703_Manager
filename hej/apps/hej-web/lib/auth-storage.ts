const AUTH_STORAGE_KEY = "hej.auth.access_token"

export type AccessTokenStorageMode = "localStorage" | "sessionStorage"

function getWindowStorage(mode: AccessTokenStorageMode): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return mode === "localStorage" ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function getAllStorages(): Array<Storage | null> {
  if (typeof window === "undefined") return [null, null]
  return [window.localStorage, window.sessionStorage]
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null

  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY) ?? window.sessionStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredAccessToken(
  token: string,
  options?: { persistence?: AccessTokenStorageMode },
): void {
  if (typeof window === "undefined") return

  const mode = options?.persistence ?? "localStorage"
  const primary = getWindowStorage(mode)
  const secondary = getWindowStorage(mode === "localStorage" ? "sessionStorage" : "localStorage")

  try {
    primary?.setItem(AUTH_STORAGE_KEY, token)
    secondary?.removeItem(AUTH_STORAGE_KEY)
  } catch {
    /* non-fatal; storage may be disabled */
  }
}

export function clearStoredAccessToken(): void {
  if (typeof window === "undefined") return

  for (const storage of getAllStorages()) {
    try {
      storage?.removeItem(AUTH_STORAGE_KEY)
    } catch {
      /* non-fatal */
    }
  }
}
