import { DashboardHomeReadPath } from "@/components/dashboard-home-read-path"
import { getProjectsOverviewData } from "@/lib/project-data"

export default async function Page() {
  const initialView = await getProjectsOverviewData()

  return <DashboardHomeReadPath initialView={initialView} />
}
