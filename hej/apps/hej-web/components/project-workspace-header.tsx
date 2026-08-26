"use client"

import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { useProjectWorkspace } from "@/components/project-workspace-client-shell"
import { formatGovernanceModelLabel } from "@/lib/governance-model"

export function ProjectWorkspaceHeader() {
  const { view } = useProjectWorkspace()
  const { organization, project } = view

  return (
    <section className="hej-surface-dark rounded-[1.2rem] border border-slate-900/10 bg-white/84 px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:shadow-[0_14px_36px_rgba(2,6,23,0.28)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Project workspace
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              {project.name}
            </h1>
            <Badge className="bg-amber-300 text-slate-950">
              {organization.displayName}
            </Badge>
            <Badge className="bg-slate-950 text-stone-100 dark:bg-white dark:text-slate-950">
              {formatGovernanceModelLabel(project.governanceModel)}
            </Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {project.description}
          </p>
        </div>
        <div className="flex shrink-0 items-start">
          <Button asChild variant="outline" size="sm">
            <Link href="/projects">Back to project list</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
