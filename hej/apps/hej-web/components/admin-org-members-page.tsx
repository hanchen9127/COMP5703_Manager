"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCcw } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { ApiFallbackBanner } from "@/components/api-fallback-banner"
import { AdminOrgMemberCreateDialog } from "@/components/admin-org-member-create-dialog"
import { AdminOrgMemberRemoveDialog } from "@/components/admin-org-member-remove-dialog"
import { AdminOrgMemberRolesDialog } from "@/components/admin-org-member-roles-dialog"
import { AdminOrgMemberStatusDialog } from "@/components/admin-org-member-status-dialog"
import { AdminOrgMembersTable } from "@/components/admin-org-members-table"
import { PageHeader } from "@/components/page-header"
import { listOrgMembersForAdmin, type AdminOrgMember } from "@/lib/api/admin-iam"

type AdminOrgMembersPageProps = {
  organizationId: string
}

type LoadState = "loading" | "ready" | "error"

export function AdminOrgMembersPage({ organizationId }: AdminOrgMembersPageProps) {
  const [members, setMembers] = useState<AdminOrgMember[]>([])
  const [includeRemoved, setIncludeRemoved] = useState(false)
  const [state, setState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMember, setSelectedMember] = useState<AdminOrgMember | null>(null)
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const loadMembers = useCallback(
    async (opts?: { refreshing?: boolean; includeRemovedOverride?: boolean }) => {
      const refreshing = opts?.refreshing ?? false
      const nextIncludeRemoved = opts?.includeRemovedOverride ?? includeRemoved

      if (refreshing) {
        setIsRefreshing(true)
      } else {
        setState("loading")
      }
      setErrorMessage(null)
      setErrorStatus(null)

      const result = await listOrgMembersForAdmin(organizationId, nextIncludeRemoved)
      if (result.ok) {
        setMembers(result.data)
        setState("ready")
        setIsRefreshing(false)
        setErrorStatus(null)
        return
      }

      setMembers([])
      setState("error")
      setIsRefreshing(false)
      setErrorStatus(result.error.status)
      setErrorMessage(result.error.message)
    },
    [includeRemoved, organizationId],
  )

  useEffect(() => {
    void loadMembers({ includeRemovedOverride: includeRemoved })
  }, [includeRemoved, loadMembers])

  const hasError = state === "error" && errorMessage != null
  const permissionDenied = errorStatus === 403
  const emptyState = state === "ready" && members.length === 0

  function handleEditRoles(member: AdminOrgMember) {
    setSelectedMember(member)
    setRolesDialogOpen(true)
  }

  function handleEditStatus(member: AdminOrgMember) {
    setSelectedMember(member)
    setStatusDialogOpen(true)
  }

  function handleRemoveMember(member: AdminOrgMember) {
    setSelectedMember(member)
    setRemoveDialogOpen(true)
  }

  function handleCreateUser() {
    setCreateDialogOpen(true)
  }

  function handleCloseDialogs() {
    setRolesDialogOpen(false)
    setStatusDialogOpen(false)
    setRemoveDialogOpen(false)
    setCreateDialogOpen(false)
    setSelectedMember(null)
  }

  function handleRefresh() {
    void loadMembers({ refreshing: true, includeRemovedOverride: includeRemoved })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Admin IAM"
        title="Organization members"
        description="Read-only directory of organization members and their current access posture."
        badges={[
          { label: `Org ${organizationId}`, tone: "outline" },
          { label: includeRemoved ? "Including removed" : "Active only", tone: "accent" },
        ]}
      />

      <ApiFallbackBanner
        show={Boolean(hasError)}
        onRetry={handleRefresh}
        isRetrying={isRefreshing}
        message={
          permissionDenied
            ? "You do not have permission to view this organization’s members."
            : `Failed to load organization members.${errorMessage ? ` ${errorMessage}` : ""}`
        }
        badgeLabel={permissionDenied ? "Permission denied" : "Load error"}
      />

      <Card className="rounded-[1.15rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_14px_36px_rgba(2,6,23,0.28)]">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Members directory
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            Live backend data only. Use the toggle to include removed members.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 px-4 md:px-5">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeRemoved}
              onChange={(event) => setIncludeRemoved(event.target.checked)}
              className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            Include removed members
          </label>
          <Button type="button" onClick={handleCreateUser} className="bg-slate-900 text-white hover:bg-slate-800">
            Create user
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCcw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Badge
            variant="outline"
            className="hej-surface-soft border-slate-900/12 bg-stone-50 text-slate-700 dark:border-white/10 dark:text-slate-300"
          >
            {members.length} members
          </Badge>
        </CardContent>
      </Card>

      {state === "loading" ? (
        <div className="rounded-[1.15rem] border border-slate-900/10 bg-white/80 p-6 text-sm text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          Loading members…
        </div>
      ) : null}

      {emptyState ? (
        <div className="rounded-[1.15rem] border border-slate-900/10 bg-white/80 p-6 text-sm text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          No members found for this organization.
        </div>
      ) : null}

      {members.length > 0 ? (
        <AdminOrgMembersTable
          members={members}
          onEditRoles={handleEditRoles}
          onEditStatus={handleEditStatus}
          onRemoveMember={handleRemoveMember}
        />
      ) : null}

      <AdminOrgMemberRolesDialog
        organizationId={organizationId}
        member={selectedMember}
        open={rolesDialogOpen}
        onClose={handleCloseDialogs}
        onSaved={() => void loadMembers({ refreshing: true, includeRemovedOverride: includeRemoved })}
      />

      <AdminOrgMemberStatusDialog
        organizationId={organizationId}
        member={selectedMember}
        open={statusDialogOpen}
        onClose={handleCloseDialogs}
        onSaved={() => void loadMembers({ refreshing: true, includeRemovedOverride: includeRemoved })}
      />

      <AdminOrgMemberRemoveDialog
        organizationId={organizationId}
        member={selectedMember}
        open={removeDialogOpen}
        onClose={handleCloseDialogs}
        onRemoved={() => void loadMembers({ refreshing: true, includeRemovedOverride: includeRemoved })}
      />

      <AdminOrgMemberCreateDialog
        organizationId={organizationId}
        open={createDialogOpen}
        onClose={handleCloseDialogs}
        onCreated={() => void loadMembers({ refreshing: true, includeRemovedOverride: includeRemoved })}
      />
    </div>
  )
}
