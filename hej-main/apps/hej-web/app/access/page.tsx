import { notFound } from "next/navigation"
import { KeyRound, Shield, UserRoundCheck } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { AccessOverview } from "@/components/access-overview"
import { PageHeader } from "@/components/page-header"
import { getAccessView } from "@/lib/mock-data"

export default function AccessPage() {
  const view = getAccessView()

  if (!view) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Identity and access"
        title="Authenticated organization entry"
        description="The first workflow stage is not annotation. It is verified identity, organization scope, and role-aware access to all downstream actions."
        badges={[
          { label: view.user.status, tone: "outline" },
          { label: view.organization.displayName, tone: "accent" },
          { label: "2FA active", tone: "dark" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "User",
            value: view.user.displayName,
            icon: UserRoundCheck,
          },
          {
            label: "Memberships",
            value: `${view.user.memberships.length}`,
            icon: KeyRound,
          },
          {
            label: "Granted roles",
            value: `${view.user.roles.length}`,
            icon: Shield,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="hej-surface-dark gap-3 rounded-[1.1rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10"
          >
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-4 md:px-5">
              <p className="text-base font-semibold text-slate-950">{value}</p>
              <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                <Icon className="size-3.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <AccessOverview user={view.user} organization={view.organization} />

      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/78 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Identity workflow checkpoints
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            Students should treat these as product surfaces, not just backend middleware.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:px-5 md:grid-cols-3">
          {[
            "Login and session verification",
            "Organization membership resolution",
            "Role-aware action exposure",
          ].map((step, index) => (
            <div
              key={step}
              className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-4 dark:border-white/10"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Step {index + 1}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
