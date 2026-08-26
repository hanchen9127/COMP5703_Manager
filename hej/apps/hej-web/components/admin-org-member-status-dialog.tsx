"use client"

import { useEffect, useState, type FormEvent } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  updateAdminUserStatus,
  type AdminOrgMember,
  type AdminUserAccountStatus,
} from "@/lib/api/admin-iam"

type AdminOrgMemberStatusDialogProps = {
  organizationId: string
  member: AdminOrgMember | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const STATUS_OPTIONS: AdminUserAccountStatus[] = ["active", "suspended", "restricted"]

function isEditableAccountStatus(status: string): status is AdminUserAccountStatus {
  return STATUS_OPTIONS.includes(status as AdminUserAccountStatus)
}

export function AdminOrgMemberStatusDialog({
  organizationId,
  member,
  open,
  onClose,
  onSaved,
}: AdminOrgMemberStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<AdminUserAccountStatus>("active")
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !member) {
      return
    }
    setSelectedStatus(isEditableAccountStatus(member.account_status) ? member.account_status : "active")
    setErrorMessage(null)
    setIsSaving(false)
  }, [member, open])

  if (!open || !member) {
    return null
  }

  const activeMember = member

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    setIsSaving(true)
    setErrorMessage(null)

    const result = await updateAdminUserStatus(activeMember.user_id, selectedStatus, organizationId)
    if (result.ok) {
      setIsSaving(false)
      onSaved()
      onClose()
      return
    }

    setIsSaving(false)
    if (result.error.status === 403) {
      setErrorMessage("You do not have permission to update this user’s account status.")
      return
    }
    if (result.error.status === 409) {
      setErrorMessage("This status change would violate account safety rules.")
      return
    }
    setErrorMessage(result.error.message)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
      <Card className="w-full max-w-lg rounded-[1.25rem] border-slate-900/10 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-slate-950/95">
        <CardHeader className="px-5 pb-3">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Edit account status
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {activeMember.name?.trim() ? activeMember.name : "Unnamed member"} · {activeMember.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5">
          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              {STATUS_OPTIONS.map((status) => {
                const checked = selectedStatus === status
                return (
                  <label
                    key={status}
                    className="flex items-center justify-between rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    <span className="flex items-center gap-2 font-medium capitalize">
                      <input
                        type="radio"
                        name="account-status"
                        checked={checked}
                        onChange={() => setSelectedStatus(status)}
                        className="size-4 border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      {status}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        checked
                          ? "border-slate-900/12 bg-slate-900 text-white dark:border-white/10 dark:bg-white dark:text-slate-950"
                          : "hej-surface-soft border-slate-900/12 bg-stone-50 text-slate-600 dark:border-white/10 dark:text-slate-300"
                      }
                    >
                      {checked ? "Selected" : "Off"}
                    </Badge>
                  </label>
                )
              })}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save status"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
