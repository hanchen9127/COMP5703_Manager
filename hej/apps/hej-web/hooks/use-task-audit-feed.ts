"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { getTaskAuditLogs, type HistoryCategory, type TaskHistoryEvent } from "@/lib/api/task-history"
import { delay, HYDRATE_MAX_ATTEMPTS, HYDRATE_RETRY_DELAY_MS } from "@/lib/live-hydrate"

function isRetryableHistoryError(status: number): boolean {
  return status === 0 || status === 404 || status >= 500
}

type UseTaskAuditFeedOptions = {
  limit?: number
  category?: HistoryCategory
}

/**
 * Lightweight audit log fetch for Overview, HistoryDrawer, and other summaries.
 */
export function useTaskAuditFeed(taskId: string, options?: UseTaskAuditFeedOptions) {
  const limit = options?.limit ?? 20
  const category = options?.category
  const { token } = useAuth()

  const [events, setEvents] = useState<TaskHistoryEvent[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const generationRef = useRef(0)

  const refresh = useCallback(async () => {
    const generation = ++generationRef.current

    if (!token) {
      if (generation !== generationRef.current) return
      setEvents([])
      setTotalCount(0)
      setLoading(false)
      setError("Sign in to load activity.")
      return
    }

    setLoading(true)
    setError(null)

    let lastError: string | null = null

    for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt += 1) {
      if (generation !== generationRef.current) return

      const result = await getTaskAuditLogs(taskId, {
        limit,
        offset: 0,
        category,
      })

      if (result.ok) {
        if (generation !== generationRef.current) return
        setEvents(result.data.logs)
        setTotalCount(result.data.total_count)
        setLoading(false)
        return
      }

      lastError = result.error.message
      if (
        !isRetryableHistoryError(result.error.status) ||
        attempt === HYDRATE_MAX_ATTEMPTS - 1
      ) {
        break
      }

      await delay(HYDRATE_RETRY_DELAY_MS)
    }

    if (generation !== generationRef.current) return

    setEvents([])
    setTotalCount(0)
    setError(lastError ?? "Failed to load activity.")
    setLoading(false)
  }, [category, limit, taskId, token])

  useEffect(() => {
    void refresh()
    return () => {
      generationRef.current += 1
    }
  }, [refresh])

  return {
    events,
    totalCount,
    loading,
    error,
    refresh,
  }
}
