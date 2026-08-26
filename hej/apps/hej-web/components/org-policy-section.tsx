"use client"

import { useEffect, useRef, useState } from "react"
import { ShieldCheck } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  patchOrganizationPolicy,
  type ApiOrganizationPolicy,
  type PatchOrganizationPolicyInput,
} from "@/lib/api/organizations"
import { PolicySaveFeedback } from "@/components/policy-save-feedback"
import { usePolicyNotice } from "@/hooks/use-policy-notice"
import {
  DISPUTE_ESCALATION_GATES,
  ORG_ANNOTATION_MODES,
  organizationPolicyFormFromApi,
  organizationPolicyFormsEqual,
  organizationPolicySummaryRows,
} from "@/lib/policy-display"

type OrgPolicySectionProps = {
  organizationId: string
  organizationName: string
  policy: ApiOrganizationPolicy | null
  canEdit: boolean
  onSaved?: () => void
}

export function OrgPolicySection({
  organizationId,
  organizationName,
  policy,
  canEdit,
  onSaved,
}: OrgPolicySectionProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<PatchOrganizationPolicyInput | null>(null)
  const [pending, setPending] = useState(false)
  const { feedback, showNotice, clearNotice } = usePolicyNotice()
  const baselineRef = useRef<PatchOrganizationPolicyInput | null>(null)

  useEffect(() => {
    if (policy) {
      setForm(organizationPolicyFormFromApi(policy))
    }
  }, [policy])

  if (!policy) {
    return (
      <Card className="hej-surface-dark rounded-[1.2rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
            Organization defaults
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            Connect with a valid token to load governance policy for {organizationName}.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const summaryRows = organizationPolicySummaryRows(policy)

  function beginEditing() {
    const initial = organizationPolicyFormFromApi(policy!)
    baselineRef.current = initial
    setForm(initial)
    clearNotice()
    setEditing(true)
  }

  async function handleSave() {
    if (!form || !baselineRef.current) return

    if (!organizationPolicyFormsEqual(form, baselineRef.current)) {
      setPending(true)
      clearNotice()
      const result = await patchOrganizationPolicy(organizationId, form)
      setPending(false)
      if (!result.ok) {
        showNotice({ kind: "error", message: result.error.message })
        return
      }
      showNotice({ kind: "success", message: "Organization policy updated." })
      setEditing(false)
      baselineRef.current = null
      onSaved?.()
      return
    }

    setEditing(false)
    baselineRef.current = null
    showNotice({ kind: "info", message: "No changes to save." })
  }

  return (
    <Card className="hej-surface-dark rounded-[1.2rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10">
      <CardHeader className="flex flex-col gap-3 px-4 md:flex-row md:items-start md:justify-between md:px-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-slate-700" />
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
              Organization defaults
            </CardTitle>
          </div>
          <CardDescription className="max-w-2xl text-[13px] leading-5 text-slate-600">
            Tenant-level governance for {organizationName}. Tasks inherit dispute and export
            controls unless they declare task-specific policy refs. Individual tasks may override
            review posture with their own review policy bundle.
          </CardDescription>
        </div>
        {canEdit && policy ? (
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setEditing(false)
                    setForm(organizationPolicyFormFromApi(policy))
                    baselineRef.current = null
                    clearNotice()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-slate-900 text-stone-100"
                  disabled={pending}
                  onClick={() => void handleSave()}
                >
                  {pending ? "Saving…" : "Save defaults"}
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={beginEditing}>
                Edit defaults
              </Button>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-slate-500">Org admin access required to edit.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-5">
        <PolicySaveFeedback feedback={feedback} />

        {editing && form ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                key: "membership_approval_required" as const,
                label: "Membership approval required",
              },
              { key: "review_dual_sign_off" as const, label: "Review dual sign-off" },
              {
                key: "review_auto_escalate_disagreement" as const,
                label: "Auto-escalate reviewer disagreement",
              },
              { key: "export_provenance_required" as const, label: "Export provenance required" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-lg border border-slate-900/10 bg-stone-50/80 px-3 py-2.5 text-sm text-slate-800"
              >
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300"
                  checked={Boolean(form[key])}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev ? { ...prev, [key]: event.target.checked } : prev,
                    )
                  }
                />
                {label}
              </label>
            ))}

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Dispute escalation gate
              </p>
              <Select
                value={form.dispute_escalation_gate ?? "none"}
                onValueChange={(value) =>
                  setForm((prev) =>
                    prev ? { ...prev, dispute_escalation_gate: value } : prev,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPUTE_ESCALATION_GATES.map((gate) => (
                    <SelectItem key={gate} value={gate}>
                      {gate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Dispute threshold (%)
              </p>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.dispute_escalation_threshold ?? 0}
                onChange={(event) =>
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          dispute_escalation_threshold: Number(event.target.value),
                        }
                      : prev,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Export retention (days)
              </p>
              <Input
                type="number"
                min={1}
                value={form.export_retention_days ?? 365}
                onChange={(event) =>
                  setForm((prev) =>
                    prev
                      ? { ...prev, export_retention_days: Number(event.target.value) }
                      : prev,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Default annotation mode
              </p>
              <Select
                value={form.annotation_mode ?? "human_first"}
                onValueChange={(value) =>
                  setForm((prev) => (prev ? { ...prev, annotation_mode: value } : prev))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORG_ANNOTATION_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode === "ai_assisted" ? "AI-assisted" : "Human-first"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryRows.map((row) => (
              <div
                key={row.label}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {row.label}
                </p>
                <p className="mt-1 text-sm font-medium leading-5 text-slate-900">{row.value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
