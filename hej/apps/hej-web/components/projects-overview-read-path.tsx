"use client"

import { useEffect, useState } from "react"

import { ApiFallbackBanner } from "@/components/api-fallback-banner"
import { PageHeader } from "@/components/page-header"
import { ProjectsOverviewLoading } from "@/components/projects-overview-loading"
import { ProjectsOverviewPanel } from "@/components/projects-overview-panel"
import { useLiveProjectsOverview } from "@/hooks/use-live-projects-overview"
import type { ProjectsOverviewData } from "@/lib/project-data"

type ProjectsOverviewReadPathProps = {
  initialView: ProjectsOverviewData
}

/**
 * SSR paints demo data without a JWT. When a token exists, this path shows a
 * loading shell, hydrates from the API (with retries), then swaps in live data.
 */
export function ProjectsOverviewReadPath({
  initialView,
}: ProjectsOverviewReadPathProps) {
  const { view, phase, isRetrying, retry } = useLiveProjectsOverview(initialView)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const projectCountLabel = isHydrated ? `${view.projects.length} projects` : "projects"
  const organizationCountLabel = isHydrated
    ? `${view.organizations.length} organizations`
    : "organizations"

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Projects"
        title="Governed work programs"
        description="Projects is the portfolio layer above task execution. It should let users create a project, understand how many exist, inspect their statuses, and enter the right workspace without ambiguity."
        badges={[
          {
            label: projectCountLabel,
            tone: "outline",
          },
          {
            label: organizationCountLabel,
            tone: "accent",
          },
          { label: "project-first routing", tone: "dark" },
        ]}
      />

      {phase === "loading" ? (
        <ProjectsOverviewLoading />
      ) : (
        <>
          <ApiFallbackBanner
            show={phase === "fallback"}
            onRetry={retry}
            isRetrying={isRetrying}
          />
          <ProjectsOverviewPanel
            organizations={view.organizations}
            projects={view.projects}
            tasks={view.tasks}
          />
        </>
      )}
    </div>
  )
}
