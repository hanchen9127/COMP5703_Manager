"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { getTaskSetup, type ApiTaskSetup } from "@/lib/api/task-setup"
import type { ApiResolvedPolicy } from "@/lib/api/policies"
import { delay, HYDRATE_MAX_ATTEMPTS, HYDRATE_RETRY_DELAY_MS } from "@/lib/live-hydrate"

function isRetryableEnrichmentError(status: number): boolean {
  return status === 0 || status === 404 || status >= 500
}

export type TaskWorkspaceEnrichmentSource = "live" | "unavailable"

export function useTaskWorkspaceEnrichment(taskId: string) {
  const { token } = useAuth()
  const [liveSetup, setLiveSetup] = useState<ApiTaskSetup | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<TaskWorkspaceEnrichmentSource>("unavailable")
  const generationRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!token) {
      setLiveSetup(null)
      setSource("unavailable")
      setLoading(false)
      setError(null)
      return
    }

    const generation = generationRef.current + 1
    generationRef.current = generation
    setLoading(true)
    setError(null)

    let lastMessage = "Unable to load task setup."

    for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt += 1) {
      const result = await getTaskSetup(taskId)
      if (generation !== generationRef.current) {
        return
      }

      if (result.ok) {
        setLiveSetup(result.data)
        setSource("live")
        setLoading(false)
        setError(null)
        return
      }

      lastMessage = result.error.message
      if (!isRetryableEnrichmentError(result.error.status) || attempt === HYDRATE_MAX_ATTEMPTS - 1) {
        break
      }
      await delay(HYDRATE_RETRY_DELAY_MS)
    }

    setLiveSetup(null)
    setSource("unavailable")
    setLoading(false)
    setError(lastMessage)
  }, [taskId, token])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const resolvedPolicy: ApiResolvedPolicy | null =
    source === "live" && liveSetup ? liveSetup.resolved_policy : null

  return {
    liveSetup,
    resolvedPolicy,
    loading,
    error,
    source,
    refresh,
  }
}
