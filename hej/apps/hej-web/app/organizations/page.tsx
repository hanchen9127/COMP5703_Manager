"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Building2, Users } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { getAuthToken } from "@/lib/api/auth"
import { listOrganizations, type ApiOrganization } from "@/lib/api/organizations"
import { listProjects } from "@/lib/api/projects"

type Phase = "loading" | "live" | "auth_required" | "error"

type OrganizationRow = ApiOrganization & { projectCount: number | null }

export default function OrganizationsPage() {
  const [phase, setPhase] = useState<Phase>("loading")
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([])

  useEffect(() => {
    let cancelled = false
    const hasToken = Boolean(getAuthToken())
    console.debug("[organizations hydrate] hasToken", hasToken)
    console.debug("[organizations hydrate] current render phase", phase)

    async function hydrate() {
      if (!hasToken) {
        if (cancelled) return
        setPhase("auth_required")
        return
      }

      const result = await listOrganizations()
      console.debug(
        "[organizations hydrate] organizations request status",
        result.ok ? "ok" : `error:${result.error.status}`,
      )
      console.debug(
        "[organizations hydrate] returned organization count",
        result.ok ? result.data.length : 0,
      )

      if (cancelled) return

      if (result.ok) {
        const withProjectCounts = await Promise.all(
          result.data.map(async (organization) => {
            const projectsResult = await listProjects(String(organization.id))
            return {
              ...organization,
              projectCount: projectsResult.ok ? projectsResult.data.length : null,
            }
          }),
        )

        if (cancelled) return

        setOrganizations(withProjectCounts)
        setPhase("live")
        return
      }

      setPhase(result.error.status === 401 ? "auth_required" : "error")
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [phase])

  const summary = useMemo(() => {
    const activeOrganizations = organizations.filter((item) => item.status === "active").length
    const totalMembers = organizations.reduce((sum, item) => sum + (item.members_count ?? 0), 0)
    const totalAdmins = organizations.reduce((sum, item) => sum + (item.admin_count ?? 0), 0)
    const totalProjects = organizations.reduce(
      (sum, item) => sum + (item.projectCount ?? 0),
      0,
    )
    return {
      totalOrganizations: organizations.length,
      activeOrganizations,
      totalMembers,
      totalAdmins,
      totalProjects,
    }
  }, [organizations])

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
          Organizations
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Organizations define the access boundary for projects, policies, and evaluation workflows.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Organizations", value: summary.totalOrganizations.toString(), icon: Building2 },
          { label: "Active organizations", value: summary.activeOrganizations.toString(), icon: Building2 },
          { label: "Total projects", value: summary.totalProjects.toString(), icon: Building2 },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="rounded-[1.25rem] border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {label}
              </CardTitle>
              <div className="rounded-lg bg-slate-950 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
                <Icon className="size-3.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {phase === "auth_required" ? (
        <Card className="rounded-[1.25rem] border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Organizations unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-300">
            Please sign in to view live organizations.
          </CardContent>
        </Card>
      ) : null}

      {phase === "error" ? (
        <Card className="rounded-[1.25rem] border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Organizations unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-300">
            Unable to load live organizations right now.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {organizations.map((organization) => (
          <Card
            key={organization.id}
            className="rounded-[1.25rem] border-slate-900/10 bg-white/80 dark:border-white/10 dark:bg-white/5"
          >
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {organization.name}
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Slug: {organization.slug}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {organization.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-4">
                <div className="rounded-xl border border-slate-900/10 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Members
                  </div>
                  <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                    {organization.members_count}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-900/10 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Admins
                  </div>
                  <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                    {organization.admin_count}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-900/10 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Projects
                  </div>
                  <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                    {organization.projectCount ?? "—"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href={`/organizations/${organization.slug}`}
                  className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-stone-100 dark:bg-white dark:text-slate-950"
                >
                  Open
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {phase === "loading" ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading live organizations…</p>
      ) : null}
    </div>
  )
}
