"use client"

import { useEffect, useState } from "react"

import { ResolvedPolicySummary } from "@/components/resolved-policy-summary"
import { getTaskResolvedPolicy, type ApiResolvedPolicy } from "@/lib/api/policies"

type TaskResolvedPolicyBannerProps = {
  taskId: string
  compact?: boolean
  policy?: ApiResolvedPolicy | null
}

export function TaskResolvedPolicyBanner({
  taskId,
  compact = false,
  policy: policyProp,
}: TaskResolvedPolicyBannerProps) {
  const [fetchedPolicy, setFetchedPolicy] = useState<ApiResolvedPolicy | null>(null)

  useEffect(() => {
    if (policyProp != null) {
      return
    }

    let cancelled = false
    void (async () => {
      const result = await getTaskResolvedPolicy(taskId)
      if (cancelled) return
      if (result.ok) {
        setFetchedPolicy(result.data)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [policyProp, taskId])

  const policy = policyProp ?? fetchedPolicy

  if (!policy) {
    return null
  }

  return <ResolvedPolicySummary policy={policy} compact={compact} className="mb-3" />
}
