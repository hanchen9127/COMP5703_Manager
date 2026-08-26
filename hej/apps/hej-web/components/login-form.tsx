"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { FormEvent } from "react"
import { useState } from "react"
import { ArrowRight, LockKeyhole, Mail } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { useAuth } from "@/components/auth-provider"

function getSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/projects"
  }
  return value
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState("alice@example.com")
  const [password, setPassword] = useState("SecurePass1Alice")
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextPath = getSafeNextPath(searchParams.get("next"))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const ok = await login(email.trim(), password, { keepSignedIn })
    if (!ok) {
      setError("Login failed. Check your email and password, then try again.")
      return
    }

    router.push(nextPath)
    router.refresh()
  }

  return (
    <Card className="hej-surface-dark mx-auto w-full max-w-md rounded-[1.25rem] border-slate-900/10 bg-white/84 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
      <CardHeader className="px-4 md:px-5">
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          Sign in
        </CardTitle>
        <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
          Use your workspace credentials to access projects, tasks, and governance views.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-5 md:px-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-900/10 bg-stone-50/80 px-3.5 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
              checked={keepSignedIn}
              onChange={(event) => setKeepSignedIn(event.target.checked)}
            />
            Keep me signed in
          </label>

          {error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-3 text-sm text-red-900">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full bg-slate-900 text-stone-100" disabled={isLoading}>
            <ArrowRight />
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          Need access? Contact your workspace administrator.
        </p>
      </CardContent>
    </Card>
  )
}
