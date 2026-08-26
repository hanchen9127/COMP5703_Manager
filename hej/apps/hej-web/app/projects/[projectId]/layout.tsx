import { notFound } from "next/navigation"

import { ProjectWorkspaceClientShell } from "@/components/project-workspace-client-shell"
import {
  buildBackendBridgeProjectView,
  getProjectWorkspaceView,
} from "@/lib/project-data"

export const dynamic = "force-dynamic"
export const revalidate = 0

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const { projectId } = await params
  const view =
    (await getProjectWorkspaceView(projectId)) ??
    buildBackendBridgeProjectView(projectId)

  if (!view) {
    notFound()
  }

  return (
    <ProjectWorkspaceClientShell projectId={projectId} initialView={view}>
      {children}
    </ProjectWorkspaceClientShell>
  )
}
