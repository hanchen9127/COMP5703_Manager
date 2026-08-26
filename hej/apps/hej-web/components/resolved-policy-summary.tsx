"use client"

import type { ApiResolvedPolicy } from "@/lib/api/policies"
import {
  formatDisputeGateLabel,
  formatExportPolicyLabel,
  formatReviewModeLabel,
} from "@/lib/resolved-policy"

type ResolvedPolicySummaryProps = {
  policy: ApiResolvedPolicy
  compact?: boolean
  className?: string
}

export function ResolvedPolicySummary({
  policy,
  compact = false,
  className = "",
}: ResolvedPolicySummaryProps) {
  if (compact) {
    return (
      <p className={`text-[12px] leading-5 text-slate-600 ${className}`.trim()}>
        <span className="font-medium text-slate-800">Effective rules:</span>{" "}
        {formatReviewModeLabel(policy)} · Schema {policy.label_schema_ref}
      </p>
    )
  }

  return (
    <div
      className={`rounded-lg border border-slate-900/8 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/5 ${className}`.trim()}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Resolved policy (executable)
      </p>
      <ul className="mt-1.5 space-y-1 text-[12px] leading-5 text-slate-700">
        <li>{formatReviewModeLabel(policy)}</li>
        <li>Label schema: {policy.label_schema_ref}</li>
        <li>{formatDisputeGateLabel(policy)}</li>
        <li>{formatExportPolicyLabel(policy)}</li>
        {policy.rules_summary.map((line) => (
          <li key={line} className="text-slate-600">
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}
