import Link from "next/link"
import { ArrowRight, Building2, FolderKanban, UserCog, Waypoints } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type DashboardProductStructureProps = {
  organizationId: string
  projectId: string
  taskId: string
}

export function DashboardProductStructure({
  organizationId,
  projectId,
  taskId,
}: DashboardProductStructureProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/76 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Product structure
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            The app now follows product hierarchy first: global workspaces, then project-scoped views, then task-scoped views.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:px-5 md:grid-cols-2">
          {[
            {
              title: "Organizations",
              text: "Tenant boundary, membership, and top-level governance scope.",
              href: `/organizations/${organizationId}`,
              icon: Building2,
            },
            {
              title: "Projects",
              text: "Tasks, disputes, exports, and policy live inside project scope.",
              href: `/projects/${projectId}`,
              icon: FolderKanban,
            },
            {
              title: "Task workspace",
              text: "Setup, items, execution desks, review, and history remain task-scoped.",
              href: `/tasks/${taskId}/review`,
              icon: Waypoints,
            },
            {
              title: "Admin",
              text: "User management, role grants, and tenant controls live here.",
              href: "/admin",
              icon: UserCog,
            },
          ].map(({ title, text, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-4 transition-colors hover:bg-white dark:border-white/10 dark:hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-900 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
                    <Icon className="size-3.5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                </div>
                <ArrowRight className="size-4 text-slate-500 dark:text-slate-400" />
              </div>
              <p className="mt-3 text-[13px] leading-5 text-slate-600 dark:text-slate-300">{text}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Shared core reminder
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            The frontend is now organized the same way the backend should be organized: hierarchy first, workflow inside scope.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:px-5">
          {[
            "Global navigation stays stable: Dashboard, Organizations, Projects, Admin.",
            "Disputes, exports, and policies move into project scope instead of pretending to be top-level apps.",
            "Task setup, items, execution desks, review, and history stay task-scoped so backend APIs map cleanly to execution objects.",
          ].map((item) => (
            <div
              key={item}
              className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/82 p-3.5 text-[13px] leading-5 text-slate-700 dark:border-white/10 dark:text-slate-300"
            >
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
