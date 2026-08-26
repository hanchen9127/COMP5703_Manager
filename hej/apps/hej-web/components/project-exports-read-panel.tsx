"use client"

import { useMemo } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { ProjectExportTable } from "@/components/project-export-table"
import { useProjectWorkspace } from "@/components/project-workspace-client-shell"

export function ProjectExportsReadPanel() {
  const { view } = useProjectWorkspace()
  const summary = useMemo(() => {
    const finalizedItemCount = view.exports.reduce(
      (count, item) => count + (item.finalizedItemCount ?? 0),
      0,
    )
    const totalItemCount = view.exports.reduce(
      (count, item) => count + (item.totalItemCount ?? 0),
      0,
    )
    const isFullProjectReady = view.exports.some((item) => item.isFullProjectReady)
    return { finalizedItemCount, totalItemCount, isFullProjectReady }
  }, [view.exports])

  return (
    <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
      <CardHeader className="px-4 md:px-5">
        <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
          Project exports
        </CardTitle>
        <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
          Draft task export packages are staged here. Full project export readiness is tracked separately.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-5">
        <div className="hej-surface-soft mb-4 rounded-xl border border-slate-900/10 bg-stone-50/80 p-4 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Draft task export packages
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {summary.finalizedItemCount} draft task export package
                {summary.finalizedItemCount === 1 ? "" : "s"} available
              </p>
            </div>
            <Badge
              className={
                summary.isFullProjectReady
                  ? "bg-emerald-100 text-emerald-800"
                  : "border border-slate-900/10 bg-white text-slate-700"
              }
            >
              {summary.isFullProjectReady
                ? "Full project export ready"
                : "Task export staged"}
            </Badge>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-slate-600">
            {summary.isFullProjectReady
              ? `All required outputs are complete${summary.totalItemCount ? ` (${summary.finalizedItemCount}/${summary.totalItemCount})` : "."}`
              : "You can review staged draft task export packages now. The full project package becomes available once all required tasks are complete."}
          </p>
        </div>
        {view.exports.length === 0 ? null : (
          <ProjectExportTable exports={view.exports} />
        )}
      </CardContent>
    </Card>
  )
}
