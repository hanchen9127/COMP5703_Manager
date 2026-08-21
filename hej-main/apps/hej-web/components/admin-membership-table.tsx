"use client"

import { useDeferredValue, useState } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { EntityFilters } from "@/components/entity-filters"
import type { MockAdminMember } from "@/lib/mock-data"

type AdminMembershipTableProps = {
  members: MockAdminMember[]
}

export function AdminMembershipTable({ members }: AdminMembershipTableProps) {
  const [query, setQuery] = useState("")
  const [activeOption, setActiveOption] = useState("All members")
  const deferredQuery = useDeferredValue(query)

  const options = ["All members", "Admins", "Reviewers", "2FA gaps", "Restricted"]

  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const filteredMembers = members.filter((member) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      member.displayName.toLowerCase().includes(normalizedQuery) ||
      member.email.toLowerCase().includes(normalizedQuery) ||
      member.organizationName.toLowerCase().includes(normalizedQuery)

    const matchesOption =
      activeOption === "All members" ||
      (activeOption === "Admins" && member.roles.includes("admin")) ||
      (activeOption === "Reviewers" && member.roles.includes("reviewer")) ||
      (activeOption === "2FA gaps" && !member.twoFactorEnabled) ||
      (activeOption === "Restricted" && member.status === "restricted")

    return matchesQuery && matchesOption
  })

  return (
    <div className="flex flex-col gap-3 self-start">
      <EntityFilters
        title="Membership directory"
        query={query}
        onQueryChange={setQuery}
        visibleCount={filteredMembers.length}
        placeholder="Search people, email, or tenant"
        options={options}
        activeOption={activeOption}
        onOptionChange={setActiveOption}
      />

      <div className="hej-surface-dark rounded-[1.15rem] border border-slate-900/10 bg-white/84 p-2 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:shadow-[0_14px_36px_rgba(2,6,23,0.28)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Access posture</TableHead>
              <TableHead>Last seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="grid gap-0.5">
                    <p className="font-medium text-slate-950 dark:text-slate-100">{member.displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">{member.organizationName}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {member.roles.map((role) => (
                      <Badge
                        key={`${member.id}-${role}`}
                        variant="outline"
                        className="hej-surface-soft border-slate-900/12 bg-stone-50 text-slate-700 dark:border-white/10 dark:text-slate-300"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        member.status === "active"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"
                      }
                    >
                      {member.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        member.twoFactorEnabled
                          ? "hej-surface-soft border-slate-900/12 bg-white text-slate-700 dark:border-white/10 dark:text-slate-300"
                          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
                      }
                    >
                      {member.twoFactorEnabled ? "2FA on" : "2FA required"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">{member.lastSeen}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
