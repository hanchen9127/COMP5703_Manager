"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import type { AdminOrgMember } from "@/lib/api/admin-iam"

type AdminOrgMembersTableProps = {
  members: AdminOrgMember[]
  onEditRoles: (member: AdminOrgMember) => void
  onEditStatus: (member: AdminOrgMember) => void
  onRemoveMember: (member: AdminOrgMember) => void
}

function formatDate(value?: string | null): string {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)
}

function accountStatusClass(status: string): string {
  const normalized = status.toLowerCase()
  if (normalized === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
  }
  if (normalized === "restricted") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"
  }
  if (normalized === "suspended") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
  }
  return "hej-surface-soft border-slate-900/12 bg-white text-slate-700 dark:border-white/10 dark:text-slate-300"
}

export function AdminOrgMembersTable({ members, onEditRoles, onEditStatus, onRemoveMember }: AdminOrgMembersTableProps) {
  return (
    <div className="rounded-[1.15rem] border border-slate-900/10 bg-white/84 p-2 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_14px_36px_rgba(2,6,23,0.28)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Account Status</TableHead>
            <TableHead>Membership Status</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Removed</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isRemoved = member.removed_at != null || member.membership_status === "removed"
            return (
              <TableRow key={`${member.organization_id}-${member.user_id}`}>
                <TableCell className="font-medium text-slate-950 dark:text-slate-100">
                  {member.name?.trim() ? member.name : "—"}
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">{member.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={accountStatusClass(member.account_status)}>
                    {member.account_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="hej-surface-soft border-slate-900/12 bg-stone-50 text-slate-700 dark:border-white/10 dark:text-slate-300"
                  >
                    {member.membership_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {member.roles.length > 0 ? (
                      member.roles.map((role) => (
                        <Badge
                          key={`${member.user_id}-${role}`}
                          variant="outline"
                          className="hej-surface-soft border-slate-900/12 bg-stone-50 text-slate-700 dark:border-white/10 dark:text-slate-300"
                        >
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(member.joined_at)}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(member.removed_at)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditRoles(member)}
                      disabled={isRemoved}
                    >
                      Edit roles
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditStatus(member)}
                      disabled={isRemoved}
                    >
                      Edit status
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onRemoveMember(member)}
                      disabled={isRemoved}
                      className={
                        isRemoved
                          ? "border border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400"
                          : "border border-rose-600 bg-rose-600 text-white hover:bg-rose-700 hover:text-white dark:border-rose-500 dark:bg-rose-500 dark:text-white dark:hover:bg-rose-400"
                      }
                    >
                      {isRemoved ? "Removed" : "Remove"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
