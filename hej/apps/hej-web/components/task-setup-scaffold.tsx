"use client"

import { DatabaseZap, FileCode2, GitBranchPlus, Info, ShieldAlert } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import type { TaskSetupDefinition, TaskSetupPolicyBundle } from "@/lib/task-setup-view"

type TaskSetupDefinitionBodyProps = {
  definition: TaskSetupDefinition
}

export function TaskSetupDefinitionBody({ definition }: TaskSetupDefinitionBodyProps) {
  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 dark:border-blue-800/40 dark:bg-blue-950/20">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
        <p className="text-[13px] leading-5 text-slate-700 dark:text-slate-300">
          Core task definition fields are read-only here. Update governance policy refs on the
          project Policies page; create a new task from the project workspace to change class or
          type.
        </p>
      </div>

      <div className="min-w-0 space-y-2">
        <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Task title</label>
        <Input
          value={definition.title}
          readOnly
          className="hej-surface-soft min-w-0 bg-white dark:border-white/10 dark:text-slate-100"
        />
      </div>

      <div className="min-w-0 space-y-2">
        <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Task objective</label>
        <Textarea
          value={definition.judgmentQuestion}
          readOnly
          className="hej-surface-soft min-h-28 bg-white text-slate-700 dark:border-white/10 dark:text-slate-200"
        />
      </div>

      <div className="min-w-0 space-y-2">
        <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {definition.taskClass === "judgement"
            ? "Shared judgement instructions"
            : "Shared annotation rules"}
        </label>
        <Textarea
          value={definition.annotationRules}
          readOnly
          className="hej-surface-soft min-h-32 bg-white text-slate-700 dark:border-white/10 dark:text-slate-200"
        />
      </div>
    </div>
  )
}

type TaskSetupPolicyRefsGridProps = {
  policy: TaskSetupPolicyBundle
}

export function TaskSetupPolicyRefsGrid({ policy }: TaskSetupPolicyRefsGridProps) {
  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-2">
      {[
        { icon: FileCode2, label: "Output schema", value: policy.outputSchemaRef },
        { icon: GitBranchPlus, label: "Workflow rules", value: policy.reviewPolicyRef },
        { icon: ShieldAlert, label: "Escalation rules", value: policy.disputePolicyRef },
        { icon: DatabaseZap, label: "Delivery rules", value: policy.exportPolicyRef },
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
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

type TaskSetupDataSourceBodyProps = {
  definition: TaskSetupDefinition
  policy: TaskSetupPolicyBundle
  pointerPreview: string[]
}

export function TaskSetupDataSourceBody({
  definition,
  policy,
  pointerPreview,
}: TaskSetupDataSourceBodyProps) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{policy.storageProvider}</Badge>
        <Badge className="bg-slate-950 text-stone-100">launch: {policy.taskStatus}</Badge>
        <Badge variant="outline">{policy.pointerStatus}</Badge>
      </div>
      <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 px-3.5 py-3 dark:border-white/10">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Source path</p>
        <p className="mt-2 break-all text-sm font-medium text-slate-900">
          {definition.dataSourceLabel}
        </p>
      </div>
      {pointerPreview.length === 0 ? (
        <p className="text-[13px] leading-5 text-slate-500">
          No data pointers registered yet. Use dataset registration above.
        </p>
      ) : (
        pointerPreview.map((pointer) => (
          <div
            key={pointer}
            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 px-3.5 py-3 dark:border-white/10"
          >
            <p className="break-all text-sm font-medium text-slate-900">{pointer}</p>
          </div>
        ))
      )}
      <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-3.5 dark:border-white/10">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Advanced config</p>
        <p className="mt-2 text-[13px] leading-5 text-slate-700">{policy.advancedConfig}</p>
      </div>
    </div>
  )
}
