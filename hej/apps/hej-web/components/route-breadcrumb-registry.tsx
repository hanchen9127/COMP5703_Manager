"use client"

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import type {
  ProjectRouteBreadcrumbLabels,
  TaskRouteBreadcrumbLabels,
} from "@/lib/route-breadcrumb-labels"

type RouteBreadcrumbRegistry = {
  projects: Record<string, ProjectRouteBreadcrumbLabels>
  tasks: Record<string, TaskRouteBreadcrumbLabels>
}

type RouteBreadcrumbRegistryApi = {
  registerProject: (projectId: string, labels: ProjectRouteBreadcrumbLabels | null) => void
  registerTask: (taskId: string, labels: TaskRouteBreadcrumbLabels | null) => void
  getProject: (projectId: string) => ProjectRouteBreadcrumbLabels | null
  getTask: (taskId: string) => TaskRouteBreadcrumbLabels | null
  subscribe: (listener: () => void) => () => void
}

const emptyRegistry: RouteBreadcrumbRegistry = { projects: {}, tasks: {} }

function createRouteBreadcrumbRegistry(): RouteBreadcrumbRegistryApi {
  let registry: RouteBreadcrumbRegistry = emptyRegistry
  const listeners = new Set<() => void>()

  const emit = () => {
    for (const listener of listeners) {
      listener()
    }
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const registerProject = (
    projectId: string,
    labels: ProjectRouteBreadcrumbLabels | null,
  ) => {
    const nextProjects = { ...registry.projects }
    if (labels) {
      nextProjects[projectId] = labels
    } else {
      delete nextProjects[projectId]
    }
    registry = { ...registry, projects: nextProjects }
    emit()
  }

  const registerTask = (taskId: string, labels: TaskRouteBreadcrumbLabels | null) => {
    const nextTasks = { ...registry.tasks }
    if (labels) {
      nextTasks[taskId] = labels
    } else {
      delete nextTasks[taskId]
    }
    registry = { ...registry, tasks: nextTasks }
    emit()
  }

  return {
    registerProject,
    registerTask,
    getProject: (projectId) => registry.projects[projectId] ?? null,
    getTask: (taskId) => registry.tasks[taskId] ?? null,
    subscribe,
  }
}

const RouteBreadcrumbRegistryContext = createContext<RouteBreadcrumbRegistryApi | null>(
  null,
)

let singletonRegistry: RouteBreadcrumbRegistryApi | null = null

export function getRouteBreadcrumbRegistry(): RouteBreadcrumbRegistryApi {
  if (!singletonRegistry) {
    singletonRegistry = createRouteBreadcrumbRegistry()
  }
  return singletonRegistry
}

export function RouteBreadcrumbRegistryProvider({ children }: { children: ReactNode }) {
  const api = useMemo(() => getRouteBreadcrumbRegistry(), [])
  return (
    <RouteBreadcrumbRegistryContext.Provider value={api}>
      {children}
    </RouteBreadcrumbRegistryContext.Provider>
  )
}

function useRouteBreadcrumbRegistryApi() {
  const context = useContext(RouteBreadcrumbRegistryContext)
  return context ?? getRouteBreadcrumbRegistry()
}

export function useRegisteredProjectRouteLabels(
  projectId: string | null,
): ProjectRouteBreadcrumbLabels | null {
  const api = useRouteBreadcrumbRegistryApi()
  return useSyncExternalStore(
    api.subscribe,
    () => (projectId ? api.getProject(projectId) : null),
    () => null,
  )
}

export function useRegisteredTaskRouteLabels(
  taskId: string | null,
): TaskRouteBreadcrumbLabels | null {
  const api = useRouteBreadcrumbRegistryApi()
  return useSyncExternalStore(
    api.subscribe,
    () => (taskId ? api.getTask(taskId) : null),
    () => null,
  )
}
