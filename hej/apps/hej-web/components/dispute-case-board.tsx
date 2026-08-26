"use client"

import { ArrowRightLeft, FileWarning, ShieldCheck } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { MockTask, MockTaskItem } from "@/lib/domain/task-types"
import type { ActivityEvent } from "@/lib/domain/admin-types"
import type { MockArbitrationCase, MockDisputeCase } from "@/lib/domain/case-types"

type DisputeCaseBoardProps = {
  dispute: MockDisputeCase
  task: MockTask
  taskItem: MockTaskItem
  activity: ActivityEvent[]
  arbitrationCase?: MockArbitrationCase
}

export function DisputeCaseBoard({
  dispute,
  task,
  taskItem,
  activity,
  arbitrationCase,
}: DisputeCaseBoardProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Dispute evidence bundle
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            Structured disputes should expose the conflicting judgment context instead of overwriting it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:px-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{dispute.status}</Badge>
            <Badge className="bg-amber-300 text-slate-950">{dispute.severity}</Badge>
            <Badge className="bg-slate-950 text-stone-100">{task.executionMode}</Badge>
          </div>

          <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-4 dark:border-white/10">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Task item
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{taskItem.externalRef}</p>
            <p className="mt-3 text-[13px] leading-5 text-slate-600">{taskItem.preview}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="size-4 text-slate-700" />
                <p className="text-sm font-semibold text-slate-900">Conflicting signal</p>
              </div>
              <p className="mt-3 text-[13px] leading-5 text-slate-600">
                {dispute.disagreementSummary}
              </p>
            </div>
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FileWarning className="size-4 text-slate-700" />
                <p className="text-sm font-semibold text-slate-900">Current machine label</p>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">{taskItem.aiLabel}</p>
              <p className="mt-1 text-xs text-slate-500">Confidence {taskItem.confidence}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
              Dispute handling
            </CardTitle>
            <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
              Participants, escalation status, and arbitration handoff should remain visible on one screen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-3.5 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Opened by</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{dispute.openedBy}</p>
            </div>
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-3.5 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assigned to</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{dispute.assignedTo}</p>
            </div>
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-3.5 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Arbitration</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {arbitrationCase ? arbitrationCase.status : "not escalated"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/78 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
              Recent case activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            {activity.slice(0, 3).map((event) => (
              <div
                key={`${event.time}-${event.action}-${event.actor}`}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-amber-100 p-2 text-slate-900">
                      <ShieldCheck className="size-3.5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                  </div>
                  <Badge variant="outline">{event.time}</Badge>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-slate-600">{event.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
