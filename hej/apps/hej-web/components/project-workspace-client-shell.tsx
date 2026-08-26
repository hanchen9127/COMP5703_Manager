"use client"

import { createContext, useContext, type ReactNode } from "react"

import { ApiFallbackBanner } from "@/components/api-fallback-banner"
import { ProjectWorkspaceHeader } from "@/components/project-workspace-header"
import { ProjectWorkspaceLoadingShell } from "@/components/project-workspace-loading-shell"
import { ScopedNav } from "@/components/scoped-nav"
import { useLiveProjectWorkspace } from "@/hooks/use-live-project-workspace"
import { usePublishProjectWorkspaceRouteBreadcrumbs } from "@/hooks/use-publish-workspace-route-breadcrumbs"
import type { ProjectWorkspaceView } from "@/lib/project-data"
import type { LiveHydratePhase } from "@/lib/live-hydrate"

type ProjectWorkspaceContextValue = {
  view: ProjectWorkspaceView
  phase: LiveHydratePhase
  isRetrying: boolean
  retry: () => void
  /** Refetch workspace data without the full-page loading shell. */
  refresh: () => void
  projectId: string
}

const ProjectWorkspaceContext = createContext<ProjectWorkspaceContextValue | null>(null)

export function useProjectWorkspace() {
  const context = useContext(ProjectWorkspaceContext)
  if (!context) {
    throw new Error("useProjectWorkspace must be used within ProjectWorkspaceClientShell")
  }
  return context
}

type ProjectWorkspaceClientShellProps = {
  projectId: string
  initialView: ProjectWorkspaceView
  children: ReactNode
}

export function ProjectWorkspaceClientShell({
  projectId,
  initialView,
  children,
}: ProjectWorkspaceClientShellProps) {
  const hydration = useLiveProjectWorkspace(projectId, initialView)

  usePublishProjectWorkspaceRouteBreadcrumbs(
    projectId,
    hydration.view.project.name,
  )

  if (hydration.phase === "initial-loading") {
    return <ProjectWorkspaceLoadingShell />
  }

  return (
    <ProjectWorkspaceContext.Provider
      value={{
        view: hydration.view,
        phase: hydration.phase,
        isRetrying: hydration.isRetrying,
        retry: hydration.retry,
        refresh: hydration.refresh,
        projectId,
      }}
    >
      <div className="space-y-4">
        <ProjectWorkspaceHeader />
        <ApiFallbackBanner
          show={hydration.phase === "unauthenticated" || hydration.phase === "not-found" || hydration.phase === "unreachable"}
          onRetry={hydration.retry}
          isRetrying={hydration.isRetrying}
          state={
            hydration.phase === "unauthenticated" || hydration.phase === "not-found" || hydration.phase === "unreachable"
              ? hydration.phase
              : undefined
          }
        />
        <ScopedNav
          items={[
            { href: `/projects/${projectId}`, label: "Overview" },
            { href: `/projects/${projectId}/tasks`, label: "Tasks" },
            { href: `/projects/${projectId}/disputes`, label: "Disputes" },
            { href: `/projects/${projectId}/exports`, label: "Exports" },
            { href: `/projects/${projectId}/policies`, label: "Policies" },
          ]}
        />
        {children}
      </div>
    </ProjectWorkspaceContext.Provider>
  )
}
