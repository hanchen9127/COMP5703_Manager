import { notFound } from "next/navigation"

import { ProjectWorkspaceHeader } from "@/components/project-workspace-header"
import { ScopedNav } from "@/components/scoped-nav"
import { getProjectWorkspaceView } from "@/lib/project-data"

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const { projectId } = await params
  const view = await getProjectWorkspaceView(projectId)

  if (!view) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <ProjectWorkspaceHeader organization={view.organization} project={view.project} />
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
  )
}
