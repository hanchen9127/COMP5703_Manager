"use client"

import { Boxes, FileJson2, ShieldCheck, Waypoints } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { MockTask } from "@/lib/domain/task-types"
import type { ActivityEvent } from "@/lib/domain/admin-types"
import type { MockExportPackage } from "@/lib/domain/case-types"

type ExportPackagePanelProps = {
  exportPackage: MockExportPackage
  task: MockTask
  activity: ActivityEvent[]
}

export function ExportPackagePanel({
  exportPackage,
  task,
  activity,
}: ExportPackagePanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)]">
      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Export assembly
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            Export is the last operational stage: deliver canonical judgments and provenance back to the organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:px-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{exportPackage.status}</Badge>
            <Badge className="bg-slate-950 text-stone-100">{exportPackage.format}</Badge>
            <Badge className="bg-amber-300 text-slate-950">
              {exportPackage.includesProvenance ? "with provenance" : "result only"}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                icon: Boxes,
                label: "Task scope",
                value: task.title,
              },
              {
                icon: Waypoints,
                label: "Item count",
                value: `${exportPackage.itemCount}`,
              },
              {
                icon: FileJson2,
                label: "Destination",
                value: exportPackage.destination,
              },
              {
                icon: ShieldCheck,
                label: "Export policy",
                value: "authoritative + lineage",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                    <Icon className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 break-all">
                      {value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
            Export activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 md:px-5">
          {activity.map((event) => (
            <div
              key={`${event.time}-${event.action}-export`}
              className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-3.5 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                <Badge variant="outline">{event.time}</Badge>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-slate-600">{event.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
