import { notFound } from "next/navigation"
import { FolderGit2, Shield, Users } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { OrganizationProjectTable } from "@/components/organization-project-table"
import { PageHeader } from "@/components/page-header"
import { getOrganizationView, mockData } from "@/lib/mock-data"

type PageProps = {
  params: Promise<{
    organizationId: string
  }>
}

export default async function OrganizationPage({ params }: PageProps) {
  const { organizationId } = await params
  const view = getOrganizationView(organizationId)

  if (!view) {
    notFound()
  }

  const organizationTasks = mockData.tasks.filter(
    (task) => task.projectId && view.projects.some((project) => project.id === task.projectId)
  )
  const backlogCount = organizationTasks.reduce(
    (sum, task) => sum + (task.backlogCount ?? 0),
    0
  )
  const activeProjects = view.projects.filter((project) => project.status === "active").length

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Organization overview"
        title={view.organization.displayName}
        description="Organizations define the isolation boundary for projects, exports, and governance policy. This page gives students a visible top-level anchor for the whole system."
        badges={[
          { label: view.organization.status, tone: "outline" },
          { label: "Tenant boundary", tone: "accent" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Projects",
            value: view.projects.length.toString(),
            icon: FolderGit2,
          },
          {
            label: "Active projects",
            value: activeProjects.toString(),
            icon: Users,
          },
          {
            label: "Processing backlog",
            value: `${backlogCount}`,
            icon: Shield,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="gap-3 rounded-[1.1rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_14px_36px_rgba(2,6,23,0.28)]"
          >
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {label}
              </CardTitle>
              <CardAction>
                <div className="rounded-lg bg-slate-900 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
                  <Icon className="size-3.5" />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="px-4 md:px-5">
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_14px_36px_rgba(2,6,23,0.28)]">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Projects in organization scope
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            Projects stay under one tenant boundary, but each still runs its own processing backlog, review policy, and provenance workload.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <OrganizationProjectTable
            projects={view.projects}
            tasks={organizationTasks}
          />
        </CardContent>
      </Card>
    </div>
  )
}
