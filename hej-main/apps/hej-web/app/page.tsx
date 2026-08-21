import { DashboardHero } from "@/components/dashboard-hero"
import { DashboardProductStructure } from "@/components/dashboard-product-structure"
import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardWorkflowProcess } from "@/components/dashboard-workflow-process"
import { mockData } from "@/lib/mock-data"

export default function Page() {
  const featuredTask = mockData.tasks[0]
  const featuredProject = mockData.projects[0]
  const featuredOrganization = mockData.organizations[0]

  if (!featuredTask || !featuredProject || !featuredOrganization) {
    return null
  }

  return (
    <div className="space-y-5">
      <DashboardHero projectId={featuredProject.id} />
      <DashboardStats />
      <DashboardProductStructure
        organizationId={featuredOrganization.id}
        projectId={featuredProject.id}
        taskId={featuredTask.id}
      />
      <DashboardWorkflowProcess />
    </div>
  )
}
