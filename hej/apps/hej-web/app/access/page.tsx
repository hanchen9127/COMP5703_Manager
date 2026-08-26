import { KeyRound, Shield, UserRoundCheck } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { PageHeader } from "@/components/page-header"

export default function AccessPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Identity and access"
        title="Authenticated organization entry"
        description="Access control data is not connected to a backend read path yet. This page intentionally avoids rendering mock users, organizations, memberships, or role grants."
        badges={[
          { label: "backend unavailable", tone: "outline" },
          { label: "no mock data", tone: "dark" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "User",
            value: "Backend required",
            icon: UserRoundCheck,
          },
          {
            label: "Memberships",
            value: "Backend required",
            icon: KeyRound,
          },
          {
            label: "Granted roles",
            value: "Backend required",
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

      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/78 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Identity workflow checkpoints
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            These checkpoints remain product requirements, but runtime data must come from authenticated backend APIs.
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
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Waiting for backend access data.
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
