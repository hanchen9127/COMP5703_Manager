"use client"

import { useEffect, useMemo } from "react"

import { getRouteBreadcrumbRegistry } from "@/components/route-breadcrumb-registry"
import {
  toProjectRouteBreadcrumbLabels,
  toTaskRouteBreadcrumbLabels,
} from "@/lib/route-breadcrumb-labels"

export function usePublishProjectWorkspaceRouteBreadcrumbs(
  projectId: string,
  projectName: string,
) {
  const labels = useMemo(
    () => toProjectRouteBreadcrumbLabels(projectId, projectName),
    [projectId, projectName],
  )

  useEffect(() => {
    const registry = getRouteBreadcrumbRegistry()
    registry.registerProject(projectId, labels)
    return () => registry.registerProject(projectId, null)
  }, [labels, projectId])
}

export function usePublishTaskWorkspaceRouteBreadcrumbs(input: {
  taskId: string
  taskTitle: string
  projectId: string
  projectName: string
}) {
  const labels = useMemo(
    () => toTaskRouteBreadcrumbLabels(input),
    [input.projectId, input.projectName, input.taskId, input.taskTitle],
  )

  useEffect(() => {
    const registry = getRouteBreadcrumbRegistry()
    registry.registerTask(input.taskId, labels)
    return () => registry.registerTask(input.taskId, null)
  }, [input.taskId, labels])
}
