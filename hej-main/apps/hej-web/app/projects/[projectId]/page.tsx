import { notFound } from "next/navigation"

import { ProjectWorkspaceOverview } from "@/components/project-workspace-overview"
import { getProjectWorkspaceView } from "@/lib/project-data"

type PageProps = {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = await params
  const view = await getProjectWorkspaceView(projectId)

  if (!view) {
    notFound()
  }

  return (
    <ProjectWorkspaceOverview
      project={view.project}
      tasks={view.tasks}
      disputes={view.disputes}
      exports={view.exports}
    />
  )
}
