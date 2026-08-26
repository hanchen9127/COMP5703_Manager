"use client"

import { FileCode2, FileOutput, GitBranchPlus, ShieldAlert } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { MockTask } from "@/lib/domain/task-types"
import type { MockTaskPolicy } from "@/lib/domain/policy-types"

type ProjectPolicyPanelProps = {
  tasks: MockTask[]
  policies: MockTaskPolicy[]
}

export function ProjectPolicyPanel({ tasks, policies }: ProjectPolicyPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tasks.map((task) => {
        const policy = policies.find((item) => item.taskId === task.id)

        if (!policy) {
          return null
        }

        return (
          <Card
            key={task.id}
            className="hej-surface-dark rounded-[1.2rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10"
          >
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
                {task.title}
              </CardTitle>
              <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
                Task-level policy bundle for review, dispute, and export.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 px-4 md:px-5">
              {[
                { icon: FileCode2, label: "Output schema", value: policy.outputSchemaRef },
                { icon: GitBranchPlus, label: "Review", value: policy.reviewPolicyRef },
                { icon: ShieldAlert, label: "Dispute", value: policy.disputePolicyRef },
                { icon: FileOutput, label: "Export", value: policy.exportPolicyRef },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="hej-surface-soft flex items-center gap-3 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
                >
                  <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                    <Icon className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
