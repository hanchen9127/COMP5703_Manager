"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getAuthToken } from "@/lib/api/auth"
import {
  getProjectsOverviewData,
  projectsOverviewSignature,
  type ProjectsOverviewData,
} from "@/lib/project-data"

export type LiveProjectsOverviewPhase = "loading" | "live" | "fallback"

const HYDRATE_MAX_ATTEMPTS = 3
const HYDRATE_RETRY_DELAY_MS = 400

function resolveInitialPhase(initialView: ProjectsOverviewData): LiveProjectsOverviewPhase {
  return initialView.apiError ? "fallback" : "live"
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * Client-hydrates portfolio data when a JWT is present. The server renders a
 * stable initial view, then this hook switches to a loading phase and swaps in
 * live API data when authentication is available.
 */
export function useLiveProjectsOverview(initialView: ProjectsOverviewData) {
  const [view, setView] = useState<ProjectsOverviewData>(initialView)
  const [phase, setPhase] = useState<LiveProjectsOverviewPhase>(() =>
    resolveInitialPhase(initialView),
  )
  const lastSignatureRef = useRef(projectsOverviewSignature(initialView))
  const hydrateGenerationRef = useRef(0)

  const hydrate = useCallback(async () => {
    const generation = ++hydrateGenerationRef.current
    const hasToken = Boolean(getAuthToken())

    if (!hasToken) {
      if (generation !== hydrateGenerationRef.current) return
      setPhase(initialView.apiError ? "fallback" : "live")
      return
    }

    setPhase("loading")

    let lastResult: ProjectsOverviewData = initialView

    for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt += 1) {
      if (generation !== hydrateGenerationRef.current) {
        return
      }

      const next = await getProjectsOverviewData()
      lastResult = next

      if (!next.apiError) {
        lastSignatureRef.current = projectsOverviewSignature(next)
        setView(next)
        setPhase("live")
        return
      }

      if (attempt < HYDRATE_MAX_ATTEMPTS - 1) {
        await delay(HYDRATE_RETRY_DELAY_MS)
      }
    }

    if (generation !== hydrateGenerationRef.current) {
      return
    }

    lastSignatureRef.current = projectsOverviewSignature(lastResult)
    setView(lastResult)
    setPhase("fallback")
  }, [initialView])

  useEffect(() => {
    void hydrate()

    return () => {
      hydrateGenerationRef.current += 1
    }
  }, [hydrate])

  const isRetrying = phase === "loading"

  return {
    view,
    phase,
    isRetrying,
    retry: hydrate,
  }
}
