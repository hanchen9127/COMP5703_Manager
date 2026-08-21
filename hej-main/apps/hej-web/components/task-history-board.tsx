"use client"

import { Clock3, ShieldCheck } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import type { ActivityEvent, WorkflowStep } from "@/lib/mock-data"

type TaskHistoryBoardProps = {
  activity: ActivityEvent[]
  workflow: WorkflowStep[]
}

export function TaskHistoryBoard({ activity, workflow }: TaskHistoryBoardProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Activity history
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            This view surfaces launch, annotation, review, and provenance-adjacent operational history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 md:px-5">
          {activity.map((event) => (
            <div
              key={`${event.time}-${event.action}-history`}
              className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-amber-100 p-2 text-slate-900">
                    {event.actor === "system" ? (
                      <ShieldCheck className="size-3.5" />
                    ) : (
                      <Clock3 className="size-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                    <p className="text-xs text-slate-500">{event.actor}</p>
                  </div>
                </div>
                <Badge variant="outline">{event.time}</Badge>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-slate-600">{event.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Workflow lineage
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            The task history page should bridge task setup, annotation execution, and formal workflow progression.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 md:px-5">
          {workflow.map((step, index) => (
            <div
              key={step.title}
              className="hej-surface-soft flex gap-3 rounded-xl border border-slate-900/10 bg-white/84 p-3.5 dark:border-white/10"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-stone-100">
                {index + 1}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  <Badge variant={step.tone === "default" ? "outline" : "default"}>
                    {step.state}
                  </Badge>
                </div>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
