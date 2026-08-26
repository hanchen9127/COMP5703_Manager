"use client"

import { ResolvedPolicySummary } from "@/components/resolved-policy-summary"
import { useTaskWorkspace } from "@/components/task-workspace-client-shell"

type TaskWorkspaceResolvedPolicyProps = {
  compact?: boolean
  className?: string
}

export function TaskWorkspaceResolvedPolicy({
  compact = false,
  className = "",
}: TaskWorkspaceResolvedPolicyProps) {
  const { enrichment } = useTaskWorkspace()

  if (enrichment.loading && !enrichment.resolvedPolicy) {
    return (
      <p className={`text-[12px] text-slate-500 ${className}`.trim()}>
        Loading effective policy…
      </p>
    )
  }

  if (!enrichment.resolvedPolicy) {
    return null
  }

  return (
    <ResolvedPolicySummary
      policy={enrichment.resolvedPolicy}
      compact={compact}
      className={className}
    />
  )
}
