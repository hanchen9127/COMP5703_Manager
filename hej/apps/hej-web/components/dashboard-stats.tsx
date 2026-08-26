import { Building2, FolderKanban, Gavel, Waypoints } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type DashboardStatsProps = {
  organizationCount: number
  projectCount: number
  taskCount: number
  canonicalDecisionCount: number
}

export function DashboardStats({
  organizationCount,
  projectCount,
  taskCount,
  canonicalDecisionCount,
}: DashboardStatsProps) {
  const statCards = [
    {
      label: "Organizations",
      value: String(organizationCount),
      detail: "Tenant boundary and governance scope",
      icon: Building2,
    },
    {
      label: "Projects",
      value: String(projectCount),
      detail: "Active judgment programs",
      icon: FolderKanban,
    },
    {
      label: "Tasks",
      value: String(taskCount),
      detail: "Configured human and AI workflows",
      icon: Waypoints,
    },
    {
      label: "Canonical Decisions",
      value: String(canonicalDecisionCount),
      detail: "Finalized judgments with provenance",
      icon: Gavel,
    },
  ]

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {statCards.map(({ label, value, detail, icon: Icon }) => (
        <Card
          key={label}
          className="hej-surface-dark gap-2 rounded-[1.25rem] border-slate-900/10 bg-white/72 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10"
        >
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {label}
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
              {detail}
            </CardDescription>
            <CardAction>
              <div className="rounded-full bg-slate-900 p-1.5 text-stone-100 dark:bg-white dark:text-slate-950">
                <Icon className="size-3.5" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="px-4 md:px-5">
            <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {value}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
