"use client"

import {
  BadgeCheck,
  KeyRound,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import type { MockOrganization, MockUserProfile } from "@/lib/mock-data"

type AccessOverviewProps = {
  user: MockUserProfile
  organization: MockOrganization
}

export function AccessOverview({ user, organization }: AccessOverviewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/78 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Identity checkpoint
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            Every workflow action is attributable to a named user, an organization scope, and a current role set.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:px-5 md:grid-cols-2">
          {[
            {
              icon: BadgeCheck,
              label: "Account status",
              value: user.status,
            },
            {
              icon: ShieldCheck,
              label: "Two-factor",
              value: user.twoFactorEnabled ? "Enabled" : "Disabled",
            },
            {
              icon: Users,
              label: "Organization scope",
              value: organization.displayName,
            },
            {
              icon: KeyRound,
              label: "Memberships",
              value: `${user.memberships.length} active`,
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                  <Icon className="size-3.5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Role grant surface
          </CardTitle>
          <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
            The UI should render actions from role grants, not from hard-coded assumptions about one user type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 md:px-5">
          {user.roles.map((role) => (
            <div
              key={role}
              className="hej-surface-soft flex items-center justify-between gap-3 rounded-xl border border-slate-900/10 bg-white/84 p-3.5 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-slate-900">
                  <UserCog className="size-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{role}</p>
                  <p className="text-xs text-slate-500">
                    Permissioned within {organization.displayName}
                  </p>
                </div>
              </div>
              <Badge variant="outline">granted</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
