"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  Shield,
  Scale,
} from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { mockData } from "@/lib/mock-data"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const primaryOrganization = mockData.organizations[0]
  const primaryProject = mockData.projects[0]

  if (!primaryOrganization || !primaryProject) {
    return null
  }

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: `/organizations/${primaryOrganization.id}`,
      label: "Organizations",
      icon: Building2,
    },
    {
      href: `/projects`,
      label: "Projects",
      icon: FolderKanban,
    },
    {
      href: `/admin`,
      label: "Admin",
      icon: Shield,
    },
  ]

  const breadcrumbSegments = pathname.split("/").filter(Boolean)
  const breadcrumbs =
    breadcrumbSegments.length === 0
      ? [{ href: "/", label: "Dashboard" }]
      : (() => {
          const labels: Record<string, string> = {
            new: "New",
            tasks: "Tasks",
            task: "Items",
            items: "Items",
            disputes: "Disputes",
            exports: "Exports",
            policies: "Policies",
            setup: "Setup",
            review: "Review",
            history: "History",
            access: "Access",
          }

          if (breadcrumbSegments[0] === "tasks" && breadcrumbSegments[1]) {
            const task = mockData.tasks.find((item) => item.id === breadcrumbSegments[1])
            const project = task
              ? mockData.projects.find((item) => item.id === task.projectId)
              : null

            if (task && project) {
              const crumbs = [
                { href: "/projects", label: "Projects" },
                { href: `/projects/${project.id}`, label: project.name },
                { href: `/projects/${project.id}/tasks`, label: "Tasks" },
                { href: `/tasks/${task.id}`, label: task.title },
              ]

              const taskSubpage = breadcrumbSegments[2]
              if (taskSubpage) {
                crumbs.push({
                  href: pathname,
                  label: labels[taskSubpage] ?? taskSubpage,
                })
              }

              return crumbs
            }
          }

          return breadcrumbSegments.map((segment, index) => {
            const href = `/${breadcrumbSegments.slice(0, index + 1).join("/")}`

            if (segment === "projects") {
              return { href, label: "Projects" }
            }
            if (segment === "organizations") {
              return { href, label: "Organizations" }
            }
            if (segment === "tasks") {
              return { href, label: "Tasks" }
            }
            if (segment === "admin") {
              return { href, label: "Admin" }
            }

            const organization = mockData.organizations.find((item) => item.id === segment)
            if (organization) {
              return { href, label: organization.displayName }
            }

            const project = mockData.projects.find((item) => item.id === segment)
            if (project) {
              return { href, label: project.name }
            }

            const task = mockData.tasks.find((item) => item.id === segment)
            if (task) {
              return { href, label: task.title }
            }

            return {
              href,
              label: labels[segment] ?? segment,
            }
          })
        })()

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="mx-auto grid min-h-screen w-full max-w-[1560px] gap-4 px-3 py-3 lg:grid-cols-[248px_minmax(0,1fr)] lg:px-4">
        <aside className="rounded-[1.35rem] border border-slate-900/12 bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(247,239,223,0.99))] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(17,24,39,0.98))] dark:shadow-[0_18px_40px_rgba(2,6,23,0.35)]">
          <div className="flex items-center gap-3 rounded-[1rem] bg-slate-950 px-3.5 py-3.5 text-stone-100 dark:border dark:border-white/10 dark:bg-slate-900">
            <div className="rounded-full bg-amber-300 p-2 text-slate-900">
              <Scale className="size-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                Hej!
              </p>
              <p className="text-base font-semibold">Human Evaluation & Judgment Infra</p>
            </div>
          </div>

          <nav className="mt-5 grid gap-1.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/"
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-950 text-stone-100 dark:bg-slate-800 dark:text-white dark:ring-1 dark:ring-white/10"
                      : "hej-surface-soft bg-white/72 text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:text-white"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="hej-surface-soft mt-6 rounded-[1rem] border border-slate-900/10 bg-white/88 p-3.5 dark:border-white/10">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Next milestone
            </p>
            <h2 className="mt-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">
              Annotation + governance
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
              Frontend scaffold now exposes the structure for projects, tasks,
              task items, and review flow. Students can start replacing mock
              data with API calls.
            </p>
            <Button className="mt-3 w-full bg-amber-300 text-slate-900 hover:bg-amber-200">
              Wire API
            </Button>
          </div>
        </aside>

        <main className="min-w-0 pb-5">
          <div className="hej-surface-dark rounded-[1.35rem] border border-slate-900/10 bg-white/58 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:p-4">
            <div className="hej-surface-soft mb-3 flex items-center justify-between rounded-[0.95rem] border border-slate-900/8 bg-white/78 px-4 py-2.5 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                {breadcrumbs.map((crumb, index) => (
                  <div key={`${crumb.href}-${index}`} className="flex items-center gap-2">
                    {index > 0 ? (
                      <ChevronRight className="size-4 text-slate-400 dark:text-slate-500" />
                    ) : null}
                    <Link
                      href={crumb.href}
                      className={cn(
                        "rounded-md px-2 py-1 transition-colors",
                        index === breadcrumbs.length - 1
                          ? "bg-slate-900 text-stone-100 dark:bg-white dark:text-slate-950"
                          : "text-slate-700 hover:bg-stone-100 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                      )}
                    >
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <span className="hej-surface-soft rounded-md border border-slate-900/10 bg-stone-50 px-2.5 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                  MVP
                </span>
                <span className="hej-surface-soft rounded-md border border-slate-900/10 bg-stone-50 px-2.5 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                  ToB first
                </span>
                <span className="hej-surface-soft rounded-md border border-slate-900/10 bg-stone-50 px-2.5 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                  Modular monolith
                </span>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
