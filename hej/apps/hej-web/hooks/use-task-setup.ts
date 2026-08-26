"use client"

import { useMemo } from "react"

import { useTaskWorkspace } from "@/components/task-workspace-client-shell"
import type { ApiOrganizationPolicy } from "@/lib/api/organizations"

import {
  buildTaskSetupViewFromWorkspace,
  mapApiTaskSetupToView,
  type TaskSetupView,
} from "@/lib/task-setup-view"
import type { MockTask, MockTaskItem } from "@/lib/domain/task-types"

export type TaskSetupSource = "live" | "fallback"

export function useTaskSetup(input: {
  workspaceTask: MockTask
  taskItems: MockTaskItem[]
  organizationPolicy?: ApiOrganizationPolicy | null
}) {
  const { enrichment } = useTaskWorkspace()
  const { workspaceTask, taskItems, organizationPolicy = null } = input

  const source: TaskSetupSource =
    enrichment.source === "live" && enrichment.liveSetup ? "live" : "fallback"

  const view: TaskSetupView = useMemo(() => {
    if (source === "live" && enrichment.liveSetup) {
      return mapApiTaskSetupToView(enrichment.liveSetup)
    }
    return buildTaskSetupViewFromWorkspace({
      task: workspaceTask,
      taskItems,
      organizationPolicy: organizationPolicy ?? null,
    })
  }, [source, enrichment.liveSetup, workspaceTask, taskItems, organizationPolicy])

  return {
    view,
    loading: enrichment.loading,
    error: enrichment.source === "unavailable" ? enrichment.error : null,
    source,
    refresh: enrichment.refresh,
    resolvedPolicy: enrichment.resolvedPolicy,
  }
}
