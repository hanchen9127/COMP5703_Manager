import { notFound } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ProjectDisputeTable } from "@/components/project-dispute-table"
import { getProjectWorkspaceView } from "@/lib/project-data"

type PageProps = {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectDisputesPage({ params }: PageProps) {
  const { projectId } = await params
  const view = await getProjectWorkspaceView(projectId)

  if (!view) {
    notFound()
  }

  return (
    <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
      <CardHeader className="px-4 md:px-5">
        <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
          Disputes
        </CardTitle>
        <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
          Disputes belong in project scope because they cut across task items while staying inside one governed program family.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-5">
        <ProjectDisputeTable disputes={view.disputes} />
      </CardContent>
    </Card>
  )
}
