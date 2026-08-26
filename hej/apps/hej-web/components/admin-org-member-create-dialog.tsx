"use client"

import { useEffect, useState, type FormEvent } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { createAdminUser, type AdminCreateUserRequest } from "@/lib/api/admin-iam"

type AdminOrgMemberCreateDialogProps = {
  organizationId: string
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const ROLE_OPTIONS = ["admin", "task_owner", "annotator", "reviewer"] as const

function uniqueRoles(roles: string[]): string[] {
  return Array.from(new Set(roles))
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function AdminOrgMemberCreateDialog({
  organizationId,
  open,
  onClose,
  onCreated,
}: AdminOrgMemberCreateDialogProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setEmail("")
    setName("")
    setPassword("")
    setSelectedRoles([])
    setErrorMessage(null)
    setIsCreating(false)
  }, [open])

  if (!open) return null

  function toggleRole(role: string) {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isCreating) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMessage("Email is required.")
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.")
      return
    }
    if (!password) {
      setErrorMessage("Password is required.")
      return
    }

    setIsCreating(true)
    setErrorMessage(null)

    const payload: AdminCreateUserRequest = {
      email: trimmedEmail,
      password,
      name: name.trim() ? name.trim() : null,
      organization_id: Number(organizationId),
      roles: uniqueRoles(selectedRoles),
    }
    const result = await createAdminUser(payload)
    if (result.ok) {
      setIsCreating(false)
      onCreated()
      onClose()
      return
    }

    setIsCreating(false)
    if (result.error.status === 403) {
      setErrorMessage("You do not have permission to create users in this organization.")
      return
    }
    if (result.error.status === 409) {
      setErrorMessage("A user with this email may already exist or this create request conflicts with organization rules.")
      return
    }
    if (result.error.status === 422) {
      setErrorMessage("Please check the user details and try again.")
      return
    }
    setErrorMessage(result.error.message)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
      <Card className="w-full max-w-lg rounded-[1.25rem] border-slate-900/10 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-slate-950/95">
        <CardHeader className="px-5 pb-3">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Create organization user
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Add a new user to this organization and assign initial access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5">
          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3">
              <label className="grid gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={isCreating}
                  required
                />
              </label>

              <label className="grid gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                  placeholder="Optional display name"
                  autoComplete="name"
                  disabled={isCreating}
                />
              </label>

              <label className="grid gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                  placeholder="Initial password"
                  autoComplete="new-password"
                  disabled={isCreating}
                  required
                />
              </label>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Roles</div>
              {ROLE_OPTIONS.map((role) => {
                const checked = selectedRoles.includes(role)
                return (
                  <label
                    key={role}
                    className="flex items-center justify-between rounded-xl border border-slate-900/10 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    <span className="flex items-center gap-2 font-medium capitalize">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRole(role)}
                        className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        disabled={isCreating}
                      />
                      {role}
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
              <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400"
              >
                {isCreating ? "Creating…" : "Create user"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
