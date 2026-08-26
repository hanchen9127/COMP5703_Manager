"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getAuthToken } from "@/lib/api/auth"
import {
  delay,
  HYDRATE_MAX_ATTEMPTS,
  HYDRATE_RETRY_DELAY_MS,
  isBackendBridgeProjectName,
  resolveLiveHydratePhase,
  type LiveHydratePhase,
} from "@/lib/live-hydrate"
import {
  getProjectWorkspaceView,
  projectWorkspaceSignature,
  type ProjectWorkspaceView,
} from "@/lib/project-data"

export function useLiveProjectWorkspace(
  projectId: string,
  initialView: ProjectWorkspaceView,
) {
  const needsHydration = isBackendBridgeProjectName(
    initialView.project.name,
    initialView.project.id,
  )

  const [view, setView] = useState<ProjectWorkspaceView>(initialView)
  const [phase, setPhase] = useState<LiveHydratePhase>(() =>
    resolveLiveHydratePhase(initialView.apiError, needsHydration),
  )
  const hasHydratedRef = useRef(false)
  const lastSignatureRef = useRef(projectWorkspaceSignature(initialView))
  const hydrateGenerationRef = useRef(0)

  console.log("[project hydrate] hook mounted", {
    projectId,
    initialProjectId: initialView.project.id,
    initialProjectName: initialView.project.name,
    phase,
    needsHydration,
    hasAuthToken: Boolean(getAuthToken()),
  })

  const hydrate = useCallback(async (options?: { silent?: boolean }) => {
    const generation = ++hydrateGenerationRef.current
    const silent = options?.silent ?? false

    console.log("[project hydrate] hydrate called", {
      projectId,
      hasAuthToken: Boolean(getAuthToken()),
    })

    if (!getAuthToken()) {
      setPhase(initialView.apiError || !needsHydration ? "unreachable" : "live")
      return
    }

    if (!silent) {
      setPhase(hasHydratedRef.current ? "background-refreshing" : "initial-loading")
    }

    let lastResult: ProjectWorkspaceView | null = initialView

    for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt += 1) {
      if (generation !== hydrateGenerationRef.current) {
        return
      }

      console.log("[project hydrate] before getProjectWorkspaceView", projectId)
      const next = await getProjectWorkspaceView(projectId)
      console.log("[project hydrate] getProjectWorkspaceView result", {
        hasNext: Boolean(next),
        apiError: next?.apiError,
        project: next?.project,
        tasksCount: next?.tasks?.length,
      })
      lastResult = next

      if (next && !next.apiError) {
        lastSignatureRef.current = projectWorkspaceSignature(next)
        hasHydratedRef.current = true
        setView(next)
        setPhase("live")
        console.log("[project hydrate] final phase", "live")
        console.log("[project hydrate] final view.project", next.project)
        return
      }

      if (attempt < HYDRATE_MAX_ATTEMPTS - 1) {
        await delay(HYDRATE_RETRY_DELAY_MS)
      }
    }

    if (generation !== hydrateGenerationRef.current) {
      return
    }

    if (lastResult) {
      lastSignatureRef.current = projectWorkspaceSignature(lastResult)
      setView(lastResult)
    }
    setPhase("unreachable")
    console.log("[project hydrate] final phase", "unreachable")
    console.log("[project hydrate] final view.project", lastResult?.project)
  }, [initialView, needsHydration, projectId])

  useEffect(() => {
    void hydrate()

    return () => {
      hydrateGenerationRef.current += 1
    }
  }, [hydrate, initialView, needsHydration, projectId])

  return {
    view,
    phase,
    isRetrying: phase === "background-refreshing",
    retry: () => void hydrate(),
    refresh: () => void hydrate({ silent: true }),
  }
}
