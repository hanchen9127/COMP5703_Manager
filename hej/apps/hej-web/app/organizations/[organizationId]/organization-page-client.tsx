"use client"

import { useEffect, useMemo, useState } from "react"
import { FolderGit2, Shield, Users } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ApiFallbackBanner } from "@/components/api-fallback-banner"
import { OrganizationProjectTable } from "@/components/organization-project-table"
import { PageHeader } from "@/components/page-header"
import { getAuthToken } from "@/lib/api/auth"
import { getOrganizationDetail, listOrganizations } from "@/lib/api/organizations"
import { listProjects } from "@/lib/api/projects"
import { listTasks } from "@/lib/api/tasks"
import { mapApiOrganizationToMock, mapApiProjectToMock, mapApiTaskToMock } from "@/lib/project-data"

import type { MockTask } from "@/lib/domain/task-types"
import type { MockOrganization, MockProject } from "@/lib/domain/project-types"

type OrganizationPageClientProps = {
  organizationId: string
  initialView: {
    organization: MockOrganization | null
    projects: MockProject[]
  }
}

type OrganizationView = {
  organization: MockOrganization | null
  projects: MockProject[]
  tasks: MockTask[]
  apiError: boolean
  tasksDegraded: boolean
}

type Phase = "loading" | "live" | "fallback" | "error" | "auth_required"

function getInitialView(initialView: {
  organization: MockOrganization | null
  projects: MockProject[]
}): OrganizationView {
  return {
    organization:
      initialView.organization ?? {
        id: "unknown_org",
        displayName: "Organization",
        status: "unknown",
      },
    projects: initialView.projects,
    tasks: [],
    apiError: false,
    tasksDegraded: false,
  }
}

export function OrganizationPageClient({ organizationId, initialView }: OrganizationPageClientProps) {
  const [view, setView] = useState<OrganizationView>(() => getInitialView(initialView))
  const [phase, setPhase] = useState<Phase>("loading")

  useEffect(() => {
    let cancelled = false

    async function resolveRouteParam(routeValue: string) {
      const trimmed = routeValue.trim()
      if (/^\d+$/.test(trimmed)) {
        return Number(trimmed)
      }

      const result = await listOrganizations()
      if (!result.ok) {
        return null
      }

      const matched = result.data.find((org) => {
        const candidates = [String(org.id), org.slug, `org_${org.slug}`, `org_${org.id}`]
        return candidates.includes(trimmed)
      })

      return matched ? Number(matched.id) : null
    }

    async function hydrate() {
      setPhase("loading")
      console.debug("[org-hydrate] route organizationId", organizationId)

      const apiId = await resolveRouteParam(organizationId)
      console.debug("[org-hydrate] resolved apiId", apiId)
      if (cancelled) return

      if (apiId == null) {
        setPhase("fallback")
        console.debug("[org-hydrate] final phase", "fallback")
        return
      }

      const hasAuthToken = Boolean(getAuthToken())
      console.debug("[org-hydrate] hasAuthToken before detail request", hasAuthToken)
      if (!hasAuthToken) {
        setPhase("auth_required")
        console.debug("[org-hydrate] final phase", "auth_required")
        return
      }

      const detail = await getOrganizationDetail(apiId)
      console.debug(
        "[org-hydrate] detail result status",
        detail.ok ? "ok" : `error:${detail.error.status}`,
      )
      if (cancelled) return

      if (!detail.ok) {
        setPhase(detail.error.status === 401 ? "auth_required" : "error")
        console.debug(
          "[org-hydrate] final phase",
          detail.error.status === 401 ? "auth_required" : "error",
        )
        return
      }

      const organization = mapApiOrganizationToMock(detail.data)
      const projectsResult = await listProjects(String(apiId))
      console.debug(
        "[org-hydrate] projects result status",
        projectsResult.ok ? "ok" : `error:${projectsResult.error.status}`,
      )
      if (cancelled) return

      const projects = projectsResult.ok ? projectsResult.data.map(mapApiProjectToMock) : []
      const taskResults = await Promise.allSettled(
        projects.map(async (project) => {
          const result = await listTasks(project.id)
          return {
            tasks: result.ok ? result.data.map((task) => mapApiTaskToMock(task)) : [],
            degraded: !result.ok,
          }
        }),
      )

      if (cancelled) return

      const fulfilledTasks = taskResults
        .filter((entry): entry is PromiseFulfilledResult<{ tasks: MockTask[]; degraded: boolean }> => entry.status === "fulfilled")
        .flatMap((entry) => entry.value.tasks)
      const tasksDegraded = !projectsResult.ok || taskResults.some((entry) => entry.status === "fulfilled" && entry.value.degraded)

      setView({
        organization,
        projects,
        tasks: fulfilledTasks,
        apiError: false,
        tasksDegraded,
      })
      setPhase("live")
      console.debug("[org-hydrate] final phase", "live")
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [organizationId])

  const organizationTasks = useMemo(
    () =>
      view.tasks.filter(
        (task) => task.projectId && view.projects.some((project) => project.id === task.projectId),
      ),
    [view.projects, view.tasks],
  )

  const backlogCount = organizationTasks.reduce((sum, task) => sum + (task.backlogCount ?? 0), 0)
  const activeProjects = view.projects.filter((project) => project.status === "active").length

  if (!view.organization && (phase === "loading" || phase === "auth_required")) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-[1.3rem] border border-slate-900/10 bg-white/70 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5" />
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-28 rounded-[1.1rem] border border-slate-900/10 bg-white/70 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5"
            />
          ))}
        </div>
        <div className="h-80 rounded-[1.3rem] border border-slate-900/10 bg-white/70 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5" />
      </div>
    )
  }

  if (!view.organization) {
    return null
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Organization overview"
        title={view.organization.displayName}
        description="Organizations define the isolation boundary for projects, exports, and governance policy. This page gives students a visible top-level anchor for the whole system."
        badges={[
          { label: view.organization.status, tone: "outline" },
          { label: phase === "live" ? "Live data" : "Tenant boundary", tone: "accent" },
        ]}
      />

      <ApiFallbackBanner
        show={phase === "fallback" || phase === "error" || view.tasksDegraded}
        onRetry={() => window.location.reload()}
        isRetrying={phase === "loading"}
        message={
          phase === "error" || phase === "auth_required"
            ? "Live organization data could not be fully loaded."
            : view.tasksDegraded
              ? "Organization and projects loaded, but some task data is unavailable."
              : "Live data is partially unavailable."
        }
        badgeLabel={
          phase === "error" || phase === "auth_required"
            ? "Live error"
            : view.tasksDegraded
              ? "Tasks degraded"
              : "Degraded"
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Projects", value: view.projects.length.toString(), icon: FolderGit2 },
          { label: "Active projects", value: activeProjects.toString(), icon: Users },
          { label: "Processing backlog", value: `${backlogCount}`, icon: Shield },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="gap-3 rounded-[1.1rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_14px_36px_rgba(2,6,23,0.28)]">
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {label}
              </CardTitle>
              <CardAction>
                <div className="rounded-lg bg-slate-900 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
                  <Icon className="size-3.5" />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="px-4 md:px-5">
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_14px_36px_rgba(2,6,23,0.28)]">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Projects in organization scope
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            Projects stay under one tenant boundary, but each still runs its own processing backlog, review policy, and provenance workload.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <OrganizationProjectTable projects={view.projects} tasks={organizationTasks} />
        </CardContent>
      </Card>
    </div>
  )
}
