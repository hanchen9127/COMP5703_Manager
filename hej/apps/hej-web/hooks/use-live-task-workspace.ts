"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getAuthToken } from "@/lib/api/auth"
import {
  delay,
  HYDRATE_MAX_ATTEMPTS,
  HYDRATE_RETRY_DELAY_MS,
  isBackendBridgeTaskTitle,
  resolveLiveHydratePhase,
  type LiveHydratePhase,
} from "@/lib/live-hydrate"
import {
  fetchLiveTaskWorkspace,
  taskWorkspaceSignature,
  type TaskWorkspaceView,
} from "@/lib/live-task-workspace"
import type { MockTaskItem } from "@/lib/domain/task-types"

export function useLiveTaskWorkspace(taskId: string, initialView: TaskWorkspaceView) {
  const [view, setView] = useState<TaskWorkspaceView>(initialView)
  const [phase, setPhase] = useState<LiveHydratePhase>(() =>
    resolveLiveHydratePhase(
      initialView.apiError,
      isBackendBridgeTaskTitle(initialView.task.title, initialView.task.id),
    ),
  )
  const [lastErrorStatus, setLastErrorStatus] = useState<number | null>(null)
  const viewRef = useRef(view)
  const lastSignatureRef = useRef(taskWorkspaceSignature(initialView))
  const hydrateGenerationRef = useRef(0)
  const hasHydratedRef = useRef(false)
  const currentTaskIdRef = useRef(taskId)

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    currentTaskIdRef.current = taskId
    viewRef.current = initialView
    setView(initialView)
    setPhase(
      resolveLiveHydratePhase(
        initialView.apiError,
        isBackendBridgeTaskTitle(initialView.task.title, initialView.task.id),
      ),
    )
    setLastErrorStatus(null)
    lastSignatureRef.current = taskWorkspaceSignature(initialView)
    hasHydratedRef.current = false
    hydrateGenerationRef.current += 1
  }, [initialView, taskId])

  const hydrate = useCallback(async (options?: { silent?: boolean }) => {
    const generation = ++hydrateGenerationRef.current
    const isStale = () => generation !== hydrateGenerationRef.current || currentTaskIdRef.current !== taskId
    const currentView = viewRef.current
    const hasLiveView = hasHydratedRef.current && !currentView.apiError

    if (!getAuthToken()) {
      if (!hasLiveView) {
        setPhase("unauthenticated")
      }
      return
    }

    setLastErrorStatus(null)
    if (hasLiveView || options?.silent) {
      setPhase("background-refreshing")
    } else {
      setPhase("initial-loading")
    }

    for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt += 1) {
      const result = await fetchLiveTaskWorkspace(taskId)

      if (isStale()) {
        return
      }

      if (result.ok) {
        lastSignatureRef.current = taskWorkspaceSignature(result.data)
        hasHydratedRef.current = true
        setView(result.data)
        setPhase("live")
        return
      }

      if (result.kind === "not-found") {
        setPhase("not-found")
        return
      }

      if (result.kind === "api-error") {
        setLastErrorStatus(result.error.status)
        if (result.error.status === 401) {
          setPhase("unauthenticated")
          return
        }
        if (result.error.status === 404) {
          setPhase("not-found")
          return
        }
      }

      if (attempt < HYDRATE_MAX_ATTEMPTS - 1) {
        await delay(HYDRATE_RETRY_DELAY_MS)
      }
    }

    if (isStale()) {
      return
    }

    if (!hasLiveView && currentView.apiError) {
      const fallbackView = { ...currentView, apiError: true }
      lastSignatureRef.current = taskWorkspaceSignature(fallbackView)
      setView(fallbackView)
      viewRef.current = fallbackView
    }
    setPhase("unreachable")
  }, [taskId])

  const retry = useCallback(() => {
    void hydrate({ silent: true })
  }, [hydrate])

  const patchTaskItem = useCallback((updatedItem: MockTaskItem) => {
    setView((current) => {
      const taskItems = current.taskItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      )
      const next: TaskWorkspaceView = { ...current, taskItems }
      lastSignatureRef.current = taskWorkspaceSignature(next)
      return next
    })
  }, [])

  useEffect(() => {
    void hydrate()

    return () => {
      hydrateGenerationRef.current += 1
    }
  }, [hydrate])

  return {
    view,
    phase,
    isRetrying: phase === "background-refreshing",
    retry,
    patchTaskItem,
    lastErrorStatus,
  }
}
