"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import {
  getTaskAuditLogs,
  getTaskWorkflowLineage,
  type HistoryCategory,
  type TaskHistoryEvent,
  type TaskWorkflowLineageResponse,
} from "@/lib/api/task-history"
import { delay, HYDRATE_MAX_ATTEMPTS, HYDRATE_RETRY_DELAY_MS } from "@/lib/live-hydrate"

const PAGE_SIZE = 50

function isRetryableHistoryError(status: number): boolean {
  return status === 0 || status === 404 || status >= 500
}

export function useTaskHistory(taskId: string) {
  const { token } = useAuth()
  const [category, setCategoryState] = useState<HistoryCategory | "all">("all")
  const [workflowStepKey, setWorkflowStepKey] = useState<string | null>(null)

  const [logs, setLogs] = useState<TaskHistoryEvent[] | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [auditLoading, setAuditLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)

  const [lineage, setLineage] = useState<TaskWorkflowLineageResponse | null>(null)
  const [workflowLoading, setWorkflowLoading] = useState(true)
  const [workflowError, setWorkflowError] = useState<string | null>(null)

  const auditGenerationRef = useRef(0)
  const workflowGenerationRef = useRef(0)

  const hasMore = (logs?.length ?? 0) < totalCount

  const setCategory = useCallback((value: HistoryCategory | "all") => {
    setWorkflowStepKey(null)
    setCategoryState(value)
  }, [])

  const selectWorkflowStep = useCallback(
    (stepKey: string) => {
      setWorkflowStepKey(stepKey)
      const step = lineage?.steps.find((item) => item.key === stepKey)
      const categories = step?.filter_categories ?? []
      if (categories.length === 1 && categories[0]) {
        setCategoryState(categories[0]!)
      } else {
        setCategoryState("all")
      }
    },
    [lineage?.steps],
  )

  const displayLogs = useMemo(() => {
    if (!logs) return null
    if (!workflowStepKey || !lineage) return logs
    const step = lineage.steps.find((item) => item.key === workflowStepKey)
    const categories = step?.filter_categories ?? []
    if (categories.length === 0) return logs
    const allowed = new Set(categories)
    return logs.filter((event) => allowed.has(event.category))
  }, [lineage, logs, workflowStepKey])

  const fetchAuditPage = useCallback(
    async (offset: number, append: boolean, generation: number) => {
      const result = await getTaskAuditLogs(taskId, {
        limit: PAGE_SIZE,
        offset,
        category: category === "all" ? undefined : category,
      })

      if (generation !== auditGenerationRef.current) {
        return { ok: false as const }
      }

      if (!result.ok) {
        return {
          ok: false as const,
          error: result.error.message,
          status: result.error.status,
        }
      }

      setLogs((prev) =>
        append && prev ? [...prev, ...result.data.logs] : result.data.logs,
      )
      setTotalCount(result.data.total_count)
      return { ok: true as const }
    },
    [category, taskId],
  )

  const refreshAudit = useCallback(async () => {
    const generation = ++auditGenerationRef.current

    if (!token) {
      setLogs([])
      setTotalCount(0)
      setAuditLoading(false)
      setAuditError("Sign in to load task history.")
      return
    }

    setAuditLoading(true)
    setAuditError(null)

    let lastError: string | null = null

    for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt += 1) {
      if (generation !== auditGenerationRef.current) return

      const page = await fetchAuditPage(0, false, generation)
      if (page.ok) {
        setAuditLoading(false)
        return
      }
      lastError = page.error ?? lastError

      if (
        !page.status ||
        !isRetryableHistoryError(page.status) ||
        attempt === HYDRATE_MAX_ATTEMPTS - 1
      ) {
        break
      }

      await delay(HYDRATE_RETRY_DELAY_MS)
    }

    if (generation !== auditGenerationRef.current) return

    setLogs([])
    setTotalCount(0)
    setAuditError(lastError ?? "Failed to load activity history.")
    setAuditLoading(false)
  }, [fetchAuditPage, token])

  const loadMoreAudit = useCallback(async () => {
    if (!token || !hasMore || loadingMore || auditLoading) return

    const generation = auditGenerationRef.current
    setLoadingMore(true)

    const page = await fetchAuditPage(logs?.length ?? 0, true, generation)

    if (generation !== auditGenerationRef.current) return

    if (!page.ok) {
      setAuditError(page.error ?? "Failed to load more activity.")
    }

    setLoadingMore(false)
  }, [auditLoading, fetchAuditPage, hasMore, loadingMore, logs?.length, token])

  const refreshWorkflow = useCallback(async () => {
    const generation = ++workflowGenerationRef.current

    if (!token) {
      setLineage(null)
      setWorkflowLoading(false)
      setWorkflowError("Sign in to load workflow lineage.")
      return
    }

    setWorkflowLoading(true)
    setWorkflowError(null)

    let lastError: string | null = null

    for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt += 1) {
      if (generation !== workflowGenerationRef.current) {
        return
      }

      const result = await getTaskWorkflowLineage(taskId)

      if (result.ok) {
        if (generation !== workflowGenerationRef.current) {
          return
        }
        setLineage(result.data)
        setWorkflowLoading(false)
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

    if (generation !== workflowGenerationRef.current) {
      return
    }

    setLineage(null)
    setWorkflowError(lastError ?? "Failed to load workflow lineage.")
    setWorkflowLoading(false)
  }, [taskId, token])

  const refresh = useCallback(async () => {
    await Promise.all([refreshAudit(), refreshWorkflow()])
  }, [refreshAudit, refreshWorkflow])

  useEffect(() => {
    void refreshAudit()
    return () => {
      auditGenerationRef.current += 1
    }
  }, [refreshAudit, token, taskId, category])

  useEffect(() => {
    void refreshWorkflow()
    return () => {
      workflowGenerationRef.current += 1
    }
  }, [refreshWorkflow, token, taskId])

  return {
    logs: displayLogs,
    rawLogs: logs,
    totalCount,
    hasMore,
    category,
    setCategory,
    workflowStepKey,
    selectWorkflowStep,
    clearWorkflowStepFilter: () => setWorkflowStepKey(null),
    lineage,
    auditLoading,
    loadingMore,
    loadMoreAudit,
    auditError,
    workflowLoading,
    workflowError,
    refresh,
    refreshAudit,
    refreshWorkflow,
  }
}
