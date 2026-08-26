"use client"

import { ApiFallbackBanner } from "@/components/api-fallback-banner"
import { DashboardHero } from "@/components/dashboard-hero"
import { DashboardHomeLoading } from "@/components/dashboard-home-loading"
import { DashboardProductStructure } from "@/components/dashboard-product-structure"
import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardWorkflowProcess } from "@/components/dashboard-workflow-process"
import { pickDashboardSpotlight } from "@/lib/dashboard-spotlight"
import { useLiveProjectsOverview } from "@/hooks/use-live-projects-overview"
import type { ProjectsOverviewData } from "@/lib/project-data"

type DashboardHomeReadPathProps = {
  initialView: ProjectsOverviewData
}

export function DashboardHomeReadPath({ initialView }: DashboardHomeReadPathProps) {
  const { view, phase, isRetrying, retry } = useLiveProjectsOverview(initialView)

  if (phase === "loading") {
    return <DashboardHomeLoading />
  }

  const spotlight = pickDashboardSpotlight(view)
  if (!spotlight) {
    return (
      <div className="space-y-4">
        <ApiFallbackBanner
          show={phase === "fallback"}
          onRetry={retry}
          isRetrying={isRetrying}
        />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          No organizations or projects are available yet.
        </p>
      </div>
    )
  }

  const { organization, project, task } = spotlight

  return (
    <div className="space-y-5">
      <ApiFallbackBanner
        show={phase === "fallback"}
        onRetry={retry}
        isRetrying={isRetrying}
      />
      <DashboardHero projectId={project.id} />
      <DashboardStats
        organizationCount={view.organizations.length}
        projectCount={view.projects.length}
        taskCount={view.tasks.length}
        canonicalDecisionCount={0}
      />
      <DashboardProductStructure
        organizationId={organization.id}
        projectId={project.id}
        taskId={task.id}
      />
      <DashboardWorkflowProcess />
    </div>
  )
}
