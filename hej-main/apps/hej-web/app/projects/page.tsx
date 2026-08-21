import { PageHeader } from "@/components/page-header"
import { ProjectsOverviewPanel } from "@/components/projects-overview-panel"
import { getProjectsOverviewData } from "@/lib/project-data"

export default async function ProjectsPage() {
  const view = await getProjectsOverviewData()

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Projects"
        title="Governed work programs"
        description="Projects is the portfolio layer above task execution. It should let users create a project, understand how many exist, inspect their statuses, and enter the right workspace without ambiguity."
        badges={[
          { label: `${view.projects.length} projects`, tone: "outline" },
          { label: `${view.organizations.length} organizations`, tone: "accent" },
          { label: "project-first routing", tone: "dark" },
        ]}
      />

      <ProjectsOverviewPanel
        organizations={view.organizations}
        projects={view.projects}
        tasks={view.tasks}
      />
    </div>
  )
}
