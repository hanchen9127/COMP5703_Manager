"use client"

import { DatabaseZap, FileCode2, GitBranchPlus, ShieldAlert } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import type { MockTask, MockTaskPolicy } from "@/lib/mock-data"
import { formatTaskClassLabel, formatTaskLabel } from "@/lib/task-format"

type TaskSetupScaffoldProps = {
  task: MockTask
  policy: MockTaskPolicy
  pointerPreview: string[]
}

export function TaskSetupScaffold({
  task,
  policy,
  pointerPreview,
}: TaskSetupScaffoldProps) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <Card className="hej-surface-dark min-w-0 rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Task definition
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            Define the task class and task type, connect the storage-backed data source, choose AI-assisted or human-first execution, write shared rules, and confirm launch readiness.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-4 px-4 md:px-5">
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Task title
              </label>
              <Input value={task.title} readOnly className="hej-surface-soft min-w-0 bg-white dark:border-white/10 dark:text-slate-100" />
            </div>
            <div className="min-w-0 space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Task class
              </label>
              <Input
                value={formatTaskClassLabel(task.taskClass)}
                readOnly
                className="hej-surface-soft min-w-0 bg-white dark:border-white/10 dark:text-slate-100"
              />
            </div>
            <div className="min-w-0 space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Task type
              </label>
              <Input
                value={formatTaskLabel(task.taskType)}
                readOnly
                className="hej-surface-soft min-w-0 bg-white dark:border-white/10 dark:text-slate-100"
              />
            </div>
            <div className="min-w-0 space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Start mode
              </label>
              <Input
                value={
                  policy.executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"
                }
                readOnly
                className="hej-surface-soft min-w-0 bg-white dark:border-white/10 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Task objective
            </label>
            <Textarea
              value={task.judgmentQuestion}
              readOnly
              className="hej-surface-soft min-h-28 bg-white text-slate-700 dark:border-white/10 dark:text-slate-200"
            />
          </div>

          <div className="min-w-0 space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {task.taskClass === "judgement" ? "Shared judgement instructions" : "Shared annotation rules"}
            </label>
            <Textarea
              value={task.annotationRules}
              readOnly
              className="hej-surface-soft min-h-32 bg-white text-slate-700 dark:border-white/10 dark:text-slate-200"
            />
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {[
              {
                icon: FileCode2,
                label: "Output schema",
                value: policy.outputSchemaRef,
              },
              {
                icon: GitBranchPlus,
                label: "Workflow rules",
                value: policy.reviewPolicyRef,
              },
              {
                icon: ShieldAlert,
                label: "Escalation rules",
                value: policy.disputePolicyRef,
              },
              {
                icon: DatabaseZap,
                label: "Delivery rules",
                value: policy.exportPolicyRef,
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
                    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4">
        <Card className="hej-surface-dark min-w-0 rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
              Data source
            </CardTitle>
            <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
              Connect the external data source before launch so task items can be generated without turning the platform into the raw data owner.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-3 px-4 md:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{policy.storageProvider}</Badge>
              <Badge className="bg-slate-950 text-stone-100">
                launch: {policy.taskStatus}
              </Badge>
            </div>
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 px-3.5 py-3 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Source path
              </p>
              <p className="mt-2 break-all text-sm font-medium text-slate-900">
                {task.dataSourceLabel}
              </p>
            </div>
            {pointerPreview.map((pointer) => (
              <div
                key={pointer}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 px-3.5 py-3 dark:border-white/10"
              >
                <p className="text-sm font-medium text-slate-900">{pointer}</p>
              </div>
            ))}

            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-3.5 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Advanced config
              </p>
              <p className="mt-2 text-[13px] leading-5 text-slate-700">
                {policy.advancedConfig}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
