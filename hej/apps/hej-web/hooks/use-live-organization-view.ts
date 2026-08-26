"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getAuthToken } from "@/lib/api/auth"
import { getOrganizationDetail, listOrganizations } from "@/lib/api/organizations"
import { listProjects } from "@/lib/api/projects"
import { listTasks } from "@/lib/api/tasks"

import { mapApiOrganizationToMock, mapApiProjectToMock, mapApiTaskToMock } from "@/lib/project-data"
import type { MockTask } from "@/lib/domain/task-types"
import type { MockOrganization, MockProject } from "@/lib/domain/project-types"

export type LiveOrganizationView = {
  organization: MockOrganization | null
  projects: MockProject[]
  tasks: MockTask[]
  apiError: boolean
  tasksDegraded: boolean
}

type InitialOrganizationView = {
  organization: MockOrganization | null
  projects: MockProject[]
}

type LiveOrganizationPhase = "loading" | "live" | "fallback" | "error"

type ResolvedOrganization = {
  apiId: number
  slug: string
  name: string
}

function buildRouteFallbackView(
  organizationId: string,
  initialView: InitialOrganizationView,
): LiveOrganizationView {
  return {
    organization:
      initialView.organization ?? {
        id: organizationId,
        displayName: "Organization",
        status: "unknown",
      },
    projects: initialView.projects,
    tasks: [],
    apiError: true,
    tasksDegraded: true,
  }
}

async function resolveOrganizationRouteParam(
  organizationId: string,
): Promise<ResolvedOrganization | null> {
  if (/^\d+$/.test(organizationId.trim())) {
    return { apiId: Number(organizationId), slug: organizationId, name: organizationId }
  }

  const organizationsResult = await listOrganizations()
  if (!organizationsResult.ok) {
    console.debug("[org-hydrate] resolve organization failed", organizationsResult.error.status)
    return null
  }

  const routeKey = organizationId.trim()
  const matched = organizationsResult.data.find((org) => {
    const candidates = [String(org.id), org.slug, `org_${org.slug}`, `org_${String(org.id)}`]
    return candidates.includes(routeKey)
  })

  if (!matched) return null

  return { apiId: Number(matched.id), slug: matched.slug, name: matched.name }
}

export function useLiveOrganizationView(
  organizationId: string,
  initialView: InitialOrganizationView,
) {
  const [view, setView] = useState<LiveOrganizationView>(() =>
    buildRouteFallbackView(organizationId, initialView),
  )
  const [phase, setPhase] = useState<LiveOrganizationPhase>("loading")
  const hydrateGenerationRef = useRef(0)

  const hydrate = useCallback(async () => {
    const generation = ++hydrateGenerationRef.current
    const hasToken = Boolean(getAuthToken())

    console.debug("[org-hydrate] route organizationId", organizationId)
    console.debug("[org-hydrate] has auth token", hasToken)

    if (!hasToken) {
      if (generation !== hydrateGenerationRef.current) return
      setView(buildRouteFallbackView(organizationId, initialView))
      setPhase("fallback")
      console.debug("[org-hydrate] final phase", "fallback")
      return
    }

    setPhase("loading")

    try {
      const resolved = await resolveOrganizationRouteParam(organizationId)
      console.debug(
        "[org-hydrate] resolved apiId",
        resolved?.apiId ?? null,
        "matched",
        resolved ? `${resolved.slug} / ${resolved.name}` : "none",
      )

      if (generation !== hydrateGenerationRef.current) return
      if (!resolved) {
        setView(buildRouteFallbackView(organizationId, initialView))
        setPhase("fallback")
        console.debug("[org-hydrate] final phase", "fallback")
        return
      }

      const detailResult = await getOrganizationDetail(resolved.apiId)
      console.debug(
        "[org-hydrate] organization request status",
        detailResult.ok ? "ok" : `error:${detailResult.error.status}`,
      )
      if (generation !== hydrateGenerationRef.current) return

      if (!detailResult.ok) {
        setView(buildRouteFallbackView(organizationId, initialView))
        setPhase("error")
        console.debug("[org-hydrate] final phase", "error")
        return
      }

      const organization = mapApiOrganizationToMock(detailResult.data)
      const projectsResult = await listProjects(String(resolved.apiId))
      console.debug(
        "[org-hydrate] projects request status",
        projectsResult.ok ? "ok" : `error:${projectsResult.error.status}`,
      )
      if (generation !== hydrateGenerationRef.current) return

      const projects = projectsResult.ok ? projectsResult.data.map(mapApiProjectToMock) : []
      const taskResults = await Promise.allSettled(
        projects.map(async (project) => {
          const result = await listTasks(project.id)
          console.debug(
            "[org-hydrate] tasks request status",
            `${project.id} ${result.ok ? "ok" : `error:${result.error.status}`}`,
          )
          return {
            tasks: result.ok ? result.data.map((task) => mapApiTaskToMock(task)) : [],
            degraded: !result.ok,
          }
        }),
      )

      if (generation !== hydrateGenerationRef.current) return

      const fulfilled = taskResults
        .filter((item): item is PromiseFulfilledResult<{ tasks: MockTask[]; degraded: boolean }> => item.status === "fulfilled")
        .map((item) => item.value)
      const tasks = fulfilled.flatMap((item) => item.tasks)
      const tasksDegraded = !projectsResult.ok || fulfilled.some((item) => item.degraded)

      setView({
        organization,
        projects,
        tasks,
        apiError: false,
        tasksDegraded,
      })
      setPhase("live")
      console.debug("[org-hydrate] final phase", "live")
    } catch (error) {
      console.debug("[org-hydrate] caught error", error)
      if (generation !== hydrateGenerationRef.current) return
      setView(buildRouteFallbackView(organizationId, initialView))
      setPhase("fallback")
      console.debug("[org-hydrate] final phase", "fallback")
    }
  }, [initialView, organizationId])

  useEffect(() => {
    void hydrate()
    return () => {
      hydrateGenerationRef.current += 1
    }
  }, [hydrate])

  useEffect(() => {
    if (phase !== "loading") return
    if (!getAuthToken()) {
      setView(buildRouteFallbackView(organizationId, initialView))
      setPhase("fallback")
    }
  }, [initialView, organizationId, phase])

  return { view, phase, retry: hydrate, isRetrying: phase === "loading" }
}
