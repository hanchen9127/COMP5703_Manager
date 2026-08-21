"use client"

import { Clock3, FileWarning, ShieldCheck, UserRound } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import type { ActivityEvent, TaskAssignment, WorkflowStep } from "@/lib/mock-data"

type TaskSidePanelsProps = {
  assignments: TaskAssignment[]
  workflow: WorkflowStep[]
  finalizedCount: number
  totalCount: number
  activity: ActivityEvent[]
}

export function TaskSidePanels({
  assignments,
  workflow,
  finalizedCount,
  totalCount,
  activity,
}: TaskSidePanelsProps) {
  return (
    <div className="grid min-w-0 gap-4">
      <Card className="hej-surface-dark min-w-0 rounded-[1.25rem] border-slate-900/10 bg-white/78 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
            Execution owners
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
            Current ownership for execution, review, and downstream escalation.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={`${assignment.reviewer}-${assignment.role}`}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                    <UserRound className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {assignment.reviewer}
                    </p>
                    <p className="text-xs text-slate-500">{assignment.role}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-[13px] leading-5 text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span>Workstream</span>
                    <span className="font-medium text-slate-900">{assignment.workstream}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>SLA</span>
                    <span className="font-medium text-slate-900">{assignment.sla}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="hej-surface-dark min-w-0 rounded-[1.25rem] border-slate-900/10 bg-white/76 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
            Workflow progress
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
            {`Task progress: ${finalizedCount}/${totalCount} items finalized. Review follows annotation rather than replacing it.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <div className="space-y-3">
            {workflow.map((step, index) => (
              <div
                key={step.title}
                className="hej-surface-soft flex gap-3 rounded-xl border border-slate-900/10 bg-stone-50/80 p-3.5 dark:border-white/10"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-stone-100">
                  {index + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <Badge
                      variant={step.tone === "default" ? "outline" : "default"}
                      className={
                        step.tone === "accent"
                          ? "bg-amber-300 text-slate-950"
                          : step.tone === "dark"
                            ? "bg-slate-950 text-stone-100"
                            : ""
                      }
                    >
                      {step.state}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-900/10 bg-amber-50/80 p-3.5 text-[13px] leading-5 text-slate-700">
            <div className="flex items-center gap-2 font-medium text-slate-900">
              <FileWarning className="size-3.5" />
              Governance note
            </div>
            Annotation is the production layer. Review and dispute stay explicit afterwards so disagreement is preserved instead of being collapsed into one silent overwrite.
          </div>
        </CardContent>
      </Card>

      <Card className="hej-surface-dark min-w-0 rounded-[1.25rem] border-slate-900/10 bg-white/78 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
            Recent activity
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
            Recent workflow events relevant to this task.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <div className="space-y-3">
            {activity.map((event) => (
              <div
                key={`${event.time}-${event.action}`}
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
                      <p className="text-sm font-semibold text-slate-900">
                        {event.action}
                      </p>
                      <p className="text-xs text-slate-500">{event.actor}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {event.time}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-slate-600">
                  {event.detail}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
