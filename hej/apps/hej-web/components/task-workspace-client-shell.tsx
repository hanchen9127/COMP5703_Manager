"use client"

import Link from "next/link"
import { createContext, useContext, type ReactNode } from "react"

import { ApiFallbackBanner } from "@/components/api-fallback-banner"
import { PageHeader } from "@/components/page-header"
import { ScopedNav } from "@/components/scoped-nav"
import { TaskWorkspaceLoadingShell } from "@/components/task-workspace-loading-shell"
import { Button } from "@workspace/ui/components/button"
import { useLiveTaskWorkspace } from "@/hooks/use-live-task-workspace"
import {
  useTaskWorkspaceEnrichment,
  type TaskWorkspaceEnrichmentSource,
} from "@/hooks/use-task-workspace-enrichment"
import type { ApiTaskSetup } from "@/lib/api/task-setup"
import type { ApiResolvedPolicy } from "@/lib/api/policies"
import type { LiveHydratePhase } from "@/lib/live-hydrate"
import type { TaskWorkspaceView } from "@/lib/live-task-workspace"
import type { MockTaskItem } from "@/lib/domain/task-types"
import { usePublishTaskWorkspaceRouteBreadcrumbs } from "@/hooks/use-publish-workspace-route-breadcrumbs"
import { formatTaskClassLabel, formatTaskLabel, formatTaskStatusLabel } from "@/lib/task-format"

export type TaskWorkspaceEnrichmentState = {
  liveSetup: ApiTaskSetup | null
  resolvedPolicy: ApiResolvedPolicy | null
  loading: boolean
  error: string | null
  source: TaskWorkspaceEnrichmentSource
  refresh: () => Promise<void>
}

type TaskWorkspaceContextValue = {
  view: TaskWorkspaceView
  phase: LiveHydratePhase
  isRetrying: boolean
  retry: () => void
  patchTaskItem: (updatedItem: MockTaskItem) => void
  taskId: string
  enrichment: TaskWorkspaceEnrichmentState
}

const TaskWorkspaceContext = createContext<TaskWorkspaceContextValue | null>(null)

export function useTaskWorkspace() {
  const context = useContext(TaskWorkspaceContext)
  if (!context) {
    throw new Error("useTaskWorkspace must be used within TaskWorkspaceClientShell")
  }
  return context
}

type TaskWorkspaceClientShellProps = {
  taskId: string
  initialView: TaskWorkspaceView
  children: ReactNode
}

function TaskWorkspaceShellBody({
  taskId,
  hydration,
  children,
}: {
  taskId: string
  hydration: ReturnType<typeof useLiveTaskWorkspace>
  children: ReactNode
}) {
  const enrichment = useTaskWorkspaceEnrichment(taskId)
  const { task, project } = hydration.view

  usePublishTaskWorkspaceRouteBreadcrumbs({
    taskId,
    taskTitle: task.title,
    projectId: project.id,
    projectName: project.name,
  })
  const modeLabel =
    task.executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"
  const classLabel = formatTaskClassLabel(task.taskClass)
  const workLabel = task.taskClass === "judgement" ? "Judge" : "Annotate"
  const description =
    task.executionMode === "ai_assisted"
      ? `AI-assisted ${classLabel.toLowerCase()} task. Configure launch settings, inspect task items, monitor model runs, and enter review only after outputs are ready.`
      : `Human-first ${classLabel.toLowerCase()} task. Configure launch settings, inspect task items, complete first-pass work, and enter review only after submission.`

  const retryAll = () => {
    void hydration.retry()
    void enrichment.refresh()
  }

  const showBackgroundRefreshing = hydration.phase === "background-refreshing"
  const showUnauthenticated = hydration.phase === "unauthenticated"
  const showNotFound = hydration.phase === "not-found"
  const showUnreachable = hydration.phase === "unreachable"

  return (
    <TaskWorkspaceContext.Provider
      value={{
        view: hydration.view,
        phase: hydration.phase,
        isRetrying: hydration.isRetrying || enrichment.loading,
        retry: retryAll,
        patchTaskItem: hydration.patchTaskItem,
        taskId,
        enrichment,
      }}
    >
      <div className="space-y-4">
        <PageHeader
          eyebrow="Task workspace"
          title={task.title}
          description={description}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href={`/projects/${project.id}`}>Back to project</Link>
            </Button>
          }
          badges={[
            { label: formatTaskStatusLabel(task.status), tone: "outline" },
            { label: classLabel, tone: "outline" },
            { label: formatTaskLabel(task.taskType), tone: "accent" },
            { label: modeLabel, tone: "dark" },
            { label: project.name, tone: "dark" },
          ]}
        />
        <ApiFallbackBanner
          show={showUnauthenticated || showNotFound || showUnreachable}
          onRetry={showUnauthenticated || showNotFound || showUnreachable ? retryAll : undefined}
          isRetrying={hydration.isRetrying || enrichment.loading}
          state={
            showUnauthenticated
              ? "unauthenticated"
              : showNotFound
                ? "not-found"
                : showUnreachable
                  ? "unreachable"
                  : undefined
          }
          message={
            showUnauthenticated
              ? "Your session is not authenticated. Please log in again."
              : showNotFound
                ? "This task could not be found."
                : showUnreachable
                  ? "Live data is temporarily unreachable."
                  : undefined
          }
          badgeLabel={
            showUnauthenticated
              ? "401"
              : showNotFound
                ? "404"
                : showUnreachable
                  ? "API unreachable"
                  : undefined
          }
        />
        {showBackgroundRefreshing ? (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Refreshing live task data in the background…
          </div>
        ) : null}
        <ScopedNav
          items={[
            { href: `/tasks/${taskId}`, label: "Overview" },
            { href: `/tasks/${taskId}/setup`, label: "Setup" },
            { href: `/tasks/${taskId}/items`, label: "Items" },
            { href: `/tasks/${taskId}/annotate`, label: workLabel },
            { href: `/tasks/${taskId}/review`, label: "Review" },
            { href: `/tasks/${taskId}/dispute`, label: "Dispute" },
            { href: `/tasks/${taskId}/finalized`, label: "Finalized" },
            { href: `/tasks/${taskId}/history`, label: "History" },
          ]}
        />
        {children}
      </div>
    </TaskWorkspaceContext.Provider>
  )
}

export function TaskWorkspaceClientShell({
  taskId,
  initialView,
  children,
}: TaskWorkspaceClientShellProps) {
  const hydration = useLiveTaskWorkspace(taskId, initialView)

  if (hydration.phase === "initial-loading") {
    return <TaskWorkspaceLoadingShell />
  }

  return (
    <TaskWorkspaceShellBody taskId={taskId} hydration={hydration}>
      {children}
    </TaskWorkspaceShellBody>
  )
}
