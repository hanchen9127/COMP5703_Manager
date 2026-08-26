"use client"

import { useCallback, useEffect, useState } from "react"
import { Shield, UserCog, Users } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { AdminControlPanel } from "@/components/admin-control-panel"
import { OrgPolicySection } from "@/components/org-policy-section"
import { ApiFallbackBanner } from "@/components/api-fallback-banner"
import { useAuth } from "@/components/auth-provider"
import { getAuthToken } from "@/lib/api/auth"
import {
  getOrganizationDetail,
  listOrganizations,
  type ApiOrganizationDetail,
} from "@/lib/api/organizations"
import { canEditOrganizationPolicy } from "@/lib/auth-organization-context"
import { mapApiOrganizationDetailToMock } from "@/lib/project-data"

import type { MockOrganization } from "@/lib/domain/project-types"
import type { MockAdminMember, MockUserProfile } from "@/lib/domain/admin-types"
import type { MockTenantPolicy } from "@/lib/domain/policy-types"

type AdminReadPathProps = {
  initialUser: MockUserProfile
  initialMembers: MockAdminMember[]
  fallbackOrganizations: MockOrganization[]
  fallbackPolicy: MockTenantPolicy | null
}

export function AdminReadPath({
  initialUser,
  initialMembers,
  fallbackOrganizations,
  fallbackPolicy,
}: AdminReadPathProps) {
  const { user: authUser } = useAuth()
  const [organizations, setOrganizations] = useState(fallbackOrganizations)
  const [primaryOrg, setPrimaryOrg] = useState<ApiOrganizationDetail | null>(null)
  const [apiError, setApiError] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const hydrate = useCallback(async () => {
    if (!getAuthToken()) {
      setApiError(true)
      return
    }

    setIsRetrying(true)
    const listResult = await listOrganizations()
    if (!listResult.ok || listResult.data.length === 0) {
      setApiError(true)
      setIsRetrying(false)
      return
    }

    setOrganizations(
      listResult.data.map((org) => ({
        id: String(org.id),
        displayName: org.name,
        status: org.status,
      })),
    )

    const orgId = listResult.data[0]?.id
    if (orgId == null) {
      setApiError(true)
      setIsRetrying(false)
      return
    }

    const detailResult = await getOrganizationDetail(orgId)
    setIsRetrying(false)

    if (!detailResult.ok || detailResult.data.policy?.id == null) {
      setApiError(true)
      setPrimaryOrg(null)
      return
    }

    setPrimaryOrg(detailResult.data)
    setApiError(false)
  }, [])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const displayUser: MockUserProfile = authUser
    ? {
        id: String(authUser.user_id),
        displayName: authUser.name || authUser.email,
        email: authUser.email,
        twoFactorEnabled: authUser.two_factor_enabled,
        status: "active",
        roles: ["admin"],
        memberships: [],
      }
    : initialUser

  const primaryOrganization = primaryOrg
    ? mapApiOrganizationDetailToMock(primaryOrg)
    : organizations[0] ?? null

  const livePolicy = primaryOrg?.policy ?? null
  const policyBound = Boolean(livePolicy) || Boolean(fallbackPolicy)

  return (
    <div className="space-y-4">
      <ApiFallbackBanner show={apiError} onRetry={() => void hydrate()} isRetrying={isRetrying} />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Organizations", value: `${organizations.length}`, icon: Users },
          { label: "Managed members", value: `${initialMembers.length}`, icon: UserCog },
          {
            label: "Governance controls",
            value: policyBound ? "Policy-bound" : "Pending",
            icon: Shield,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="hej-surface-dark gap-3 rounded-[1.1rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10"
          >
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-4 md:px-5">
              <p className="text-base font-semibold text-slate-950 dark:text-slate-100">{value}</p>
              <div className="rounded-lg bg-slate-900 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
                <Icon className="size-3.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {primaryOrganization && livePolicy ? (
        <OrgPolicySection
          organizationId={primaryOrganization.id}
          organizationName={primaryOrganization.displayName}
          policy={livePolicy}
          canEdit={canEditOrganizationPolicy(primaryOrganization.id)}
          onSaved={() => void hydrate()}
        />
      ) : null}

      <AdminControlPanel
        user={displayUser}
        members={initialMembers}
        organizations={organizations}
        policy={fallbackPolicy}
        liveOrganizationPolicy={livePolicy}
        showLegacyPolicySummary={!livePolicy}
      />
    </div>
  )
}
