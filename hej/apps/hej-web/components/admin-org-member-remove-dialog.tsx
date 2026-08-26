"use client"

import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { removeAdminOrgMember, type AdminOrgMember } from "@/lib/api/admin-iam"

type AdminOrgMemberRemoveDialogProps = {
  organizationId: string
  member: AdminOrgMember | null
  open: boolean
  onClose: () => void
  onRemoved: () => void
}

export function AdminOrgMemberRemoveDialog({
  organizationId,
  member,
  open,
  onClose,
  onRemoved,
}: AdminOrgMemberRemoveDialogProps) {
  const [isRemoving, setIsRemoving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !member) return
    setErrorMessage(null)
    setIsRemoving(false)
  }, [member, open])

  if (!open || !member) return null

  const activeMember = member

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isRemoving) return

    setIsRemoving(true)
    setErrorMessage(null)

    const result = await removeAdminOrgMember(organizationId, activeMember.user_id)
    if (result.ok) {
      setIsRemoving(false)
      onRemoved()
      onClose()
      return
    }

    setIsRemoving(false)
    if (result.error.status === 403) {
      setErrorMessage("You do not have permission to remove this organization member.")
      return
    }
    if (result.error.status === 409) {
      setErrorMessage("Removing this member would violate organization admin safety rules.")
      return
    }
    setErrorMessage(result.error.message)
  }

  const displayName = activeMember.name?.trim() ? activeMember.name : "Unnamed member"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
      <Card className="w-full max-w-lg rounded-[1.25rem] border-slate-900/10 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-slate-950/95">
        <CardHeader className="px-5 pb-3">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Remove organization member
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {displayName} · {activeMember.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
            This removes the user from this organization. It does not delete the user account.
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isRemoving}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isRemoving}
                className="border border-rose-600 bg-rose-600 text-white hover:bg-rose-700 hover:text-white dark:border-rose-500 dark:bg-rose-500 dark:text-white dark:hover:bg-rose-400"
              >
                {isRemoving ? "Removing…" : "Remove member"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
