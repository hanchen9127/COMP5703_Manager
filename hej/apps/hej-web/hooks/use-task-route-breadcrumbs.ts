"use client"

import { useEffect, useState } from "react"

import { useRegisteredTaskRouteLabels } from "@/components/route-breadcrumb-registry"
import { fetchTaskRouteBreadcrumbLabels } from "@/lib/fetch-route-breadcrumb-labels"
import type { TaskRouteBreadcrumbLabels } from "@/lib/route-breadcrumb-labels"

export type { TaskRouteBreadcrumbLabels } from "@/lib/route-breadcrumb-labels"

/**
 * Resolves human-readable project/task labels for `/tasks/[taskId]` breadcrumbs.
 * Prefers labels registered by the live task workspace, then fetches from the API
 * with the same retry cadence as workspace hydration.
 */
export function useTaskRouteBreadcrumbs(
  taskId: string | null,
): TaskRouteBreadcrumbLabels | null {
  const registered = useRegisteredTaskRouteLabels(taskId)
  const [fetched, setFetched] = useState<TaskRouteBreadcrumbLabels | null>(null)

  useEffect(() => {
    if (!taskId || registered) {
      return
    }

    let cancelled = false

    void (async () => {
      const labels = await fetchTaskRouteBreadcrumbLabels(taskId)
      if (!cancelled) {
        setFetched(labels)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [registered, taskId])

  useEffect(() => {
    if (!taskId) {
      setFetched(null)
      return
    }
    setFetched((current) => (current?.taskId === taskId ? current : null))
  }, [taskId])

  if (registered) {
    return registered
  }

  return fetched
}
