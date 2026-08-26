"use client"

import { useCallback, useEffect, useState } from "react"

import type { PolicyFeedback } from "@/components/policy-save-feedback"

export const POLICY_NOTICE_DISMISS_MS = 5000

/** Success/info notices auto-dismiss; errors stay until cleared. */
export function usePolicyNotice(dismissMs = POLICY_NOTICE_DISMISS_MS) {
  const [feedback, setFeedback] = useState<PolicyFeedback | null>(null)

  useEffect(() => {
    if (!feedback || feedback.kind === "error") {
      return
    }
    const timer = window.setTimeout(() => setFeedback(null), dismissMs)
    return () => window.clearTimeout(timer)
  }, [feedback, dismissMs])

  const showNotice = useCallback((next: PolicyFeedback) => {
    setFeedback(next)
  }, [])

  const clearNotice = useCallback(() => {
    setFeedback(null)
  }, [])

  return { feedback, showNotice, clearNotice }
}
