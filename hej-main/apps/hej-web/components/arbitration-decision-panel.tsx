"use client"

import { FileCheck2, Gavel, Scale, ShieldQuestion } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import type {
  ActivityEvent,
  MockArbitrationCase,
  MockDisputeCase,
  MockTaskItem,
} from "@/lib/mock-data"

type ArbitrationDecisionPanelProps = {
  arbitrationCase: MockArbitrationCase
  dispute: MockDisputeCase
  taskItem: MockTaskItem
  activity: ActivityEvent[]
}

export function ArbitrationDecisionPanel({
  arbitrationCase,
  dispute,
  taskItem,
  activity,
}: ArbitrationDecisionPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)]">
      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(245,235,214,0.92))] shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Arbitration console
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            Arbitrators should see the dispute record, source ambiguity, and canonical decision target without leaving the page.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:px-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{arbitrationCase.status}</Badge>
            <Badge className="bg-slate-950 text-stone-100">{arbitrationCase.arbitrator}</Badge>
          </div>
          <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Dispute context
            </p>
            <p className="mt-2 text-[13px] leading-5 text-slate-600">
              {dispute.disagreementSummary}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
              <div className="flex items-center gap-2">
                <ShieldQuestion className="size-4 text-slate-700" />
                <p className="text-sm font-semibold text-slate-900">Task item</p>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">{taskItem.externalRef}</p>
              <p className="mt-2 text-[13px] leading-5 text-slate-600">{taskItem.preview}</p>
            </div>
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Scale className="size-4 text-slate-700" />
                <p className="text-sm font-semibold text-slate-900">Target outcome</p>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">
                {arbitrationCase.canonicalOutcome}
              </p>
              <p className="mt-2 text-[13px] leading-5 text-slate-600">
                {arbitrationCase.rulingSummary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
              Decision checkpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 md:px-5">
            {[
              "Conflicting judgments inspected",
              "Dispute history reviewed",
              "Policy context confirmed",
              "Canonical outcome prepared",
            ].map((item) => (
              <div
                key={item}
                className="hej-surface-soft flex items-center gap-3 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
              >
                <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                  <FileCheck2 className="size-3.5" />
                </div>
                <p className="text-sm font-medium text-slate-900">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
              Arbitration activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            {activity.slice(1, 4).map((event) => (
              <div
                key={`${event.time}-${event.action}-arb`}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-amber-100 p-2 text-slate-900">
                      <Gavel className="size-3.5" />
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
