import { notFound } from "next/navigation"

import { TaskWorkspaceClientShell } from "@/components/task-workspace-client-shell"
import {
  buildBackendBridgeWorkspaceView,
  getTaskWorkspaceView,
} from "@/lib/task-workspace-data"
import type { TaskWorkspaceView } from "@/lib/live-task-workspace"

export const dynamic = "force-dynamic"
export const revalidate = 0

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{
    taskId: string
  }>
}

export default async function TaskLayout({ children, params }: LayoutProps) {
  const { taskId } = await params
  const view =
    ((await getTaskWorkspaceView(taskId)) as TaskWorkspaceView | null) ??
    (buildBackendBridgeWorkspaceView(taskId) as TaskWorkspaceView | null)

  if (!view) {
    notFound()
  }

  return (
    <TaskWorkspaceClientShell taskId={taskId} initialView={view}>
      {children}
    </TaskWorkspaceClientShell>
  )
}
