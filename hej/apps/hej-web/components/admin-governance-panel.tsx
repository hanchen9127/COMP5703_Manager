import { AlertTriangle, Building2, ShieldCheck, UserCog } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import type { ApiOrganizationPolicy } from "@/lib/api/organizations"
import { organizationPolicySummaryRows } from "@/lib/policy-display"

import type { MockOrganization } from "@/lib/domain/project-types"
import type { MockAdminMember, MockUserProfile } from "@/lib/domain/admin-types"
import type { MockTenantPolicy } from "@/lib/domain/policy-types"

type AdminGovernancePanelProps = {
  user: MockUserProfile
  members: MockAdminMember[]
  organizations: MockOrganization[]
  policy: MockTenantPolicy | null
  liveOrganizationPolicy?: ApiOrganizationPolicy | null
  showLegacyPolicySummary?: boolean
}

export function AdminGovernancePanel({
  user,
  members,
  organizations,
  policy,
  liveOrganizationPolicy = null,
  showLegacyPolicySummary = true,
}: AdminGovernancePanelProps) {
  const primaryOrganization = organizations[0] ?? null
  const adminCount = members.filter((member) => member.roles.includes("admin")).length
  const restrictedCount = members.filter((member) => member.status === "restricted").length
  const twoFactorGapCount = members.filter((member) => !member.twoFactorEnabled).length
  const roleAssignmentCount = members.reduce((sum, member) => sum + member.roles.length, 0)

  const organizationRows = [
    {
      label: "Tenant status",
      value: primaryOrganization?.status ?? "unavailable",
      note: "Organization scope is the top-level governance boundary for members, projects, and policy ownership.",
    },
    {
      label: "Isolation boundary",
      value: policy?.isolationMode ?? "pending policy",
      note: "Admin should make tenant separation explicit even before deeper operations tooling exists.",
    },
  ]

  const accessRows = [
    {
      label: "Role assignments",
      value: `${roleAssignmentCount}`,
      note: "Role grants remain visible so students can infer assignment APIs and access checks.",
    },
    {
      label: "Admins in tenant",
      value: `${adminCount}`,
      note: "Admin is a lightweight control surface, not a hidden superuser mode.",
    },
    {
      label: "2FA posture gaps",
      value: `${twoFactorGapCount}`,
      note: "Sensitive actions should fail closed when access posture is insufficient.",
    },
    {
      label: "Restricted members",
      value: `${restrictedCount}`,
      note: "Restriction is enough to imply lightweight enforcement actions without building an incident center.",
    },
  ]

  const policyRows = liveOrganizationPolicy
    ? organizationPolicySummaryRows(liveOrganizationPolicy)
    : policy
      ? [
          { label: "Membership", value: policy.membershipApproval },
          { label: "Review", value: policy.reviewControl },
          { label: "Dispute", value: policy.disputeRouting },
          { label: "Export", value: policy.exportControl },
          { label: "Provenance", value: policy.provenanceRetention },
        ]
      : []

  return (
    <div className="grid gap-3">
      <Card className="hej-surface-dark rounded-[1.15rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,237,214,0.92))] shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            Organization summary
          </CardTitle>
          <CardDescription className="text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            Admin should make tenant identity and boundary concepts visible without becoming a full operations console.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:px-5">
          <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/88 p-3.5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-900 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
                <Building2 className="size-3.5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Primary organization
                </p>
                <p className="text-base font-semibold text-slate-950 dark:text-slate-100">
                  {primaryOrganization?.displayName ?? "Unavailable"}
                </p>
              </div>
            </div>
          </div>

          {organizationRows.map((row) => (
            <div
              key={row.label}
              className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/88 p-3.5 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.label}</p>
                <Badge className="bg-slate-950 text-stone-100 dark:bg-white dark:text-slate-950">{row.value}</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{row.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="hej-surface-dark rounded-[1.15rem] border-slate-900/10 bg-white/84 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            Role and access posture
          </CardTitle>
          <CardDescription className="text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            These counters make membership state, role visibility, and access posture legible as real backend-owned concerns.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:px-5">
          <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-900 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
                <ShieldCheck className="size-3.5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Current operator
                </p>
                <p className="text-base font-semibold text-slate-950 dark:text-slate-100">{user.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.twoFactorEnabled ? "2FA enforced" : "2FA gap"}
                </p>
              </div>
            </div>
          </div>

          {accessRows.map((row) => (
            <div
              key={row.label}
              className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.label}</p>
                <Badge variant="outline">{row.value}</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{row.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {showLegacyPolicySummary ? (
        <Card className="hej-surface-dark rounded-[1.15rem] border-slate-900/10 bg-white/84 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Tenant policy summary
            </CardTitle>
            <CardDescription className="text-[13px] leading-5 text-slate-600 dark:text-slate-300">
              {liveOrganizationPolicy
                ? "Live policy is edited in the section above. This panel keeps membership and access posture visible."
                : "Membership, review, dispute, export, and provenance rules shape downstream workflow."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 md:px-5">
            {policyRows.length === 0 ? (
              <p className="text-[13px] text-slate-600 dark:text-slate-400">
                Sign in to load organization policy from the backend.
              </p>
            ) : (
              policyRows.map((row) => (
                <div
                  key={row.label}
                  className="hej-surface-soft flex items-start justify-between gap-3 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
                >
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {row.label}
                  </p>
                  <p className="max-w-[220px] text-right text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {row.value}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="hej-surface-dark rounded-[1.15rem] border-slate-900/10 bg-white/84 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            Lightweight actions
          </CardTitle>
          <CardDescription className="text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            These are only MVP anchors for the role and policy contract, not a full incident or recovery console.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:px-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Grant role",
              "Revoke role",
              "Restrict member",
              "Update tenant policy",
            ].map((label) => (
              <Button key={label} variant="outline" className="justify-start">
                <UserCog />
                {label}
              </Button>
            ))}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-[13px] leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>
                These controls are intentionally lightweight. Deep retry, reroute, reopen, or incident handling remains out of MVP scope.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
