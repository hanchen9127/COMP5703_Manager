"use client"

import type { ApiOrganizationPolicy } from "@/lib/api/organizations"

import { AdminGovernancePanel } from "@/components/admin-governance-panel"
import { AdminMembershipTable } from "@/components/admin-membership-table"
import type { MockOrganization } from "@/lib/domain/project-types"
import type { MockAdminMember, MockUserProfile } from "@/lib/domain/admin-types"
import type { MockTenantPolicy } from "@/lib/domain/policy-types"

type AdminControlPanelProps = {
  user: MockUserProfile
  members: MockAdminMember[]
  organizations: MockOrganization[]
  policy: MockTenantPolicy | null
  liveOrganizationPolicy?: ApiOrganizationPolicy | null
  showLegacyPolicySummary?: boolean
}

export function AdminControlPanel({
  user,
  members,
  organizations,
  policy,
  liveOrganizationPolicy = null,
  showLegacyPolicySummary = true,
}: AdminControlPanelProps) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
      <AdminMembershipTable members={members} />
      <AdminGovernancePanel
        user={user}
        members={members}
        organizations={organizations}
        policy={policy}
        liveOrganizationPolicy={liveOrganizationPolicy}
        showLegacyPolicySummary={showLegacyPolicySummary}
      />
    </div>
  )
}
