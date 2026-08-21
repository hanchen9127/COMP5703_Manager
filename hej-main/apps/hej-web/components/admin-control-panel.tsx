"use client"

import type { MockAdminMember, MockOrganization, MockTenantPolicy, MockUserProfile } from "@/lib/mock-data"
import { AdminGovernancePanel } from "@/components/admin-governance-panel"
import { AdminMembershipTable } from "@/components/admin-membership-table"

type AdminControlPanelProps = {
  user: MockUserProfile
  members: MockAdminMember[]
  organizations: MockOrganization[]
  policy: MockTenantPolicy | null
}

export function AdminControlPanel({
  user,
  members,
  organizations,
  policy,
}: AdminControlPanelProps) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
      <AdminMembershipTable members={members} />
      <AdminGovernancePanel
        user={user}
        members={members}
        organizations={organizations}
        policy={policy}
      />
    </div>
  )
}
