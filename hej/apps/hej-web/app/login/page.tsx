import { Suspense } from "react"
import { ShieldCheck } from "lucide-react"

import { LoginForm } from "@/components/login-form"

function LoginPageFallback() {
  return null
}

function LoginPageContent() {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(251,244,230,0.92),transparent_38%),linear-gradient(180deg,#f7f2e7_0%,#f4eddc_52%,#f7f4ec_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(71,85,105,0.24),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)]" />
      <div className="absolute left-6 top-6 -z-10 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-300/10" />
      <div className="absolute bottom-6 right-10 -z-10 h-56 w-56 rounded-full bg-slate-300/30 blur-3xl dark:bg-slate-500/10" />

      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <section className="space-y-6 rounded-[2rem] border border-slate-900/8 bg-white/50 p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/5 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
            <ShieldCheck className="size-4 text-slate-900 dark:text-white" />
            Hej workspace access
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 md:text-5xl">
              Sign in to Hej
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Use your workspace credentials to access projects, tasks, and governance views.
            </p>
          </div>
          <div className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <p>
              Sign in with your workspace account to continue into the projects and tasks
              experience.
            </p>
            <p>
              Need access? Contact your workspace administrator.
            </p>
          </div>
        </section>

        <section className="flex justify-center">
          <LoginForm />
        </section>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
