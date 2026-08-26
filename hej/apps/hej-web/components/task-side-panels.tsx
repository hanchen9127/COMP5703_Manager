"use client"

/**
 * Overview 底部 — 两块竖向信息卡（客户端）
 *
 * 1) Execution owners：谁在执行/复审、工作流与 SLA（来自 assignments）。
 * 2) Workflow progress：workflow 步骤列表 + 通过率计数文案（approvedCount/totalCount 由父组件从 taskItems 算出）。
 *
 * 完整 audit 列表见 History tab（Overview 仅保留入口链接）。
 * 步骤 Badge 的 state：使用 formatWorkflowStepStateLabel，与 History 页 lineage 展示规则一致。
 */
import { FileWarning, UserRound } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { formatWorkflowStepStateLabel } from "@/lib/task-format"
import type { TaskAssignment, WorkflowStep } from "@/lib/domain/task-types"

type TaskSidePanelsProps = {
  assignments: TaskAssignment[]
  workflow: WorkflowStep[]
  approvedCount: number
  totalCount: number
}

export function TaskSidePanels({
  assignments,
  workflow,
  approvedCount,
  totalCount,
}: TaskSidePanelsProps) {
  return (
    <div className="grid min-w-0 gap-4">
      <Card className="hej-surface-dark min-w-0 rounded-[1.25rem] border-slate-900/10 bg-white/78 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
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
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
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
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Workflow progress
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
            {`Task progress: ${approvedCount}/${totalCount} items approved. Review follows annotation rather than replacing it.`}
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
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
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
                      {formatWorkflowStepStateLabel(step.state)}
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
    </div>
  )
}
