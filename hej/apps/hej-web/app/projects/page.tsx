import { ProjectsOverviewReadPath } from "@/components/projects-overview-read-path"
import { getProjectsOverviewData } from "@/lib/project-data"

export default async function ProjectsPage() {
  const initialView = await getProjectsOverviewData()

  return (
    <div className="space-y-4">
      <ProjectsOverviewReadPath initialView={initialView} />
    </div>
  )
}
