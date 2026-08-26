"use client"

import { useEffect, useState } from "react"

import { useRegisteredProjectRouteLabels } from "@/components/route-breadcrumb-registry"
import { fetchProjectRouteBreadcrumbLabels } from "@/lib/fetch-route-breadcrumb-labels"
import type { ProjectRouteBreadcrumbLabels } from "@/lib/route-breadcrumb-labels"

export type { ProjectRouteBreadcrumbLabels } from "@/lib/route-breadcrumb-labels"

/**
 * Resolves a human-readable project label for `/projects/[projectId]` breadcrumbs.
 * Prefers labels registered by the live project workspace, then fetches from the API.
 */
export function useProjectRouteBreadcrumbs(
  projectId: string | null,
): ProjectRouteBreadcrumbLabels | null {
  const registered = useRegisteredProjectRouteLabels(projectId)
  const [fetched, setFetched] = useState<ProjectRouteBreadcrumbLabels | null>(null)

  useEffect(() => {
    if (!projectId || registered) {
      return
    }

    let cancelled = false

    void (async () => {
      const labels = await fetchProjectRouteBreadcrumbLabels(projectId)
      if (!cancelled) {
        setFetched(labels)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [projectId, registered])

  useEffect(() => {
    if (!projectId) {
      setFetched(null)
      return
    }
    setFetched((current) => (current?.projectId === projectId ? current : null))
  }, [projectId])

  if (registered) {
    return registered
  }

  return fetched
}
