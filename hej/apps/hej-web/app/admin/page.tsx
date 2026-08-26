import { AdminReadPath } from "@/components/admin-read-path"
import { PageHeader } from "@/components/page-header"
import type { MockUserProfile } from "@/lib/domain/admin-types"

const emptyInitialUser: MockUserProfile = {
  id: "unavailable",
  displayName: "Authenticated user",
  email: "unavailable@example.com",
  twoFactorEnabled: false,
  status: "active",
  roles: [],
  memberships: [],
}

export default function AdminPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Administration"
        title="Platform administration"
        description="Admin in MVP is a lightweight control surface for identity posture, membership, role grants, and tenant policy. Runtime data is loaded from backend APIs when available."
        badges={[
          { label: "admin", tone: "outline" },
          { label: "backend read path", tone: "accent" },
          { label: "no mock fallback", tone: "dark" },
        ]}
      />

      <AdminReadPath
        initialUser={emptyInitialUser}
        initialMembers={[]}
        fallbackOrganizations={[]}
        fallbackPolicy={null}
      />
    </div>
  )
}
