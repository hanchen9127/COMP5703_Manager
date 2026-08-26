"use client"

import { createContext, useContext, useMemo, useState } from "react"

import {
  getAuthToken,
  login as loginRequest,
  logout as logoutRequest,
  type ApiAuthUser,
} from "@/lib/api/auth"
import { clearStoredAccessToken } from "@/lib/auth-storage"

type AuthContextValue = {
  token: string | null
  user: ApiAuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string, options?: { keepSignedIn?: boolean }): Promise<boolean>
  logout(): void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken())
  const [user, setUser] = useState<ApiAuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function login(
    email: string,
    password: string,
    options?: { keepSignedIn?: boolean },
  ) {
    setIsLoading(true)
    try {
      const result = await loginRequest(email, password, {
        persistence: options?.keepSignedIn ? "localStorage" : "sessionStorage",
      })
      if (!result.ok) {
        return false
      }

      setToken(result.data.access_token)
      setUser(result.data.user)
      return true
    } finally {
      setIsLoading(false)
    }
  }

  function logout() {
    logoutRequest()
    clearStoredAccessToken()
    setToken(null)
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
    }),
    [isLoading, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
