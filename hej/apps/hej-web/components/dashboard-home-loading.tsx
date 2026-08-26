/**
 * Placeholder while client-side dashboard hydration runs (JWT-backed API).
 */
export function DashboardHomeLoading() {
  return (
    <div
      className="space-y-5"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="hej-surface-dark min-h-[220px] animate-pulse rounded-[1.35rem] border border-slate-900/10 bg-slate-900/90 dark:border-white/10" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-[1.1rem] border border-slate-900/10 bg-white/80 dark:border-white/10"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-[1.2rem] border border-slate-900/10 bg-white/80 dark:border-white/10" />
        <div className="h-56 animate-pulse rounded-[1.2rem] border border-slate-900/10 bg-white/80 dark:border-white/10" />
      </div>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Loading live workspace from API…
      </p>
    </div>
  )
}
