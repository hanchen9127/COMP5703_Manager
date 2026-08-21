import { notFound } from "next/navigation"
import { Shield, UserCog, Users } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { AdminControlPanel } from "@/components/admin-control-panel"
import { PageHeader } from "@/components/page-header"
import { getAdminView, mockData } from "@/lib/mock-data"

export default function AdminPage() {
  const access = getAdminView()

  if (!access) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Administration"
        title="Platform administration"
        description="Admin in MVP is a lightweight control surface for identity posture, membership, role grants, and tenant policy. It should feel real without taking focus away from project and task execution."
        badges={[
          { label: "admin", tone: "outline" },
          { label: access.organization.displayName, tone: "accent" },
          { label: "governance-first", tone: "dark" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Organizations", value: `${mockData.organizations.length}`, icon: Users },
          { label: "Managed members", value: `${access.members.length}`, icon: UserCog },
          {
            label: "Governance controls",
            value: access.policy ? "Policy-bound" : "Pending",
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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card className="hej-surface-dark gap-3 rounded-[1.1rem] border-slate-900/10 bg-white/82 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Admin scope in the shared core
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 md:px-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <p>
              Admin is responsible for identity posture, organization membership, role
              grants, and policy ownership. It is not a generic settings page.
            </p>
            <p>
              This surface should anchor backend work for user lookup, role assignment,
              tenant administration, and future audit actions before students implement
              deeper operational controls.
            </p>
          </CardContent>
        </Card>

        <Card className="hej-surface-dark gap-3 rounded-[1.1rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(245,235,214,0.92))] shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Next backend-facing contracts
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 px-4 md:px-5 text-sm text-slate-700 dark:text-slate-300">
            {[
              "GET /users/me",
              "GET /organizations and GET /organizations/{orgId}",
              "GET /organizations/{orgId}/members",
              "GET /organizations/{orgId}/role-assignments",
              "POST/DELETE role assignments",
              "GET/PATCH /organizations/{orgId}/policy",
            ].map((item) => (
              <div
                key={item}
                className="hej-surface-soft rounded-lg border border-slate-900/10 bg-white/85 px-3 py-2.5 dark:border-white/10"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <AdminControlPanel
        user={access.user}
        members={access.members}
        organizations={mockData.organizations}
        policy={access.policy}
      />
    </div>
  )
}
