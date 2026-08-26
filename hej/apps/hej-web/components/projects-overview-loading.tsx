/**
 * Stable placeholder while client-side portfolio hydration runs.
 */
export function ProjectsOverviewLoading() {
  return (
    <div
      className="hej-surface-dark rounded-[1.3rem] border border-slate-900/10 bg-white/84 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
      aria-busy="true"
      aria-label="Loading projects portfolio"
    >
      <div className="space-y-4 px-4 py-5 md:px-5">
        <div className="h-6 w-48 rounded-lg bg-slate-200/80 animate-pulse" />
        <div className="h-4 max-w-2xl rounded-lg bg-slate-200/80 animate-pulse" />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-16 rounded-xl bg-slate-200/80 animate-pulse" />
          <div className="h-16 rounded-xl bg-slate-200/80 animate-pulse" />
          <div className="h-16 rounded-xl bg-slate-200/80 animate-pulse" />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-28 rounded-md bg-slate-200/80 animate-pulse" />
          <div className="h-6 w-28 rounded-md bg-slate-200/80 animate-pulse" />
          <div className="h-6 w-28 rounded-md bg-slate-200/80 animate-pulse" />
          <div className="h-6 w-28 rounded-md bg-slate-200/80 animate-pulse" />
          <div className="h-6 w-28 rounded-md bg-slate-200/80 animate-pulse" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[1.15rem] border border-slate-900/10 bg-stone-50/60 p-4">
            <div className="h-5 w-40 rounded-lg bg-slate-200/80 animate-pulse" />
            <div className="mt-3 h-4 w-full max-w-sm rounded-lg bg-slate-200/80 animate-pulse" />
            <div className="mt-4 flex gap-6">
              <div className="h-4 w-16 rounded-lg bg-slate-200/80 animate-pulse" />
              <div className="h-4 w-16 rounded-lg bg-slate-200/80 animate-pulse" />
            </div>
          </div>
          <div className="rounded-[1.15rem] border border-slate-900/10 bg-stone-50/60 p-4">
            <div className="h-5 w-40 rounded-lg bg-slate-200/80 animate-pulse" />
            <div className="mt-3 h-4 w-full max-w-sm rounded-lg bg-slate-200/80 animate-pulse" />
            <div className="mt-4 flex gap-6">
              <div className="h-4 w-16 rounded-lg bg-slate-200/80 animate-pulse" />
              <div className="h-4 w-16 rounded-lg bg-slate-200/80 animate-pulse" />
            </div>
          </div>
          <div className="rounded-[1.15rem] border border-slate-900/10 bg-stone-50/60 p-4">
            <div className="h-5 w-40 rounded-lg bg-slate-200/80 animate-pulse" />
            <div className="mt-3 h-4 w-full max-w-sm rounded-lg bg-slate-200/80 animate-pulse" />
            <div className="mt-4 flex gap-6">
              <div className="h-4 w-16 rounded-lg bg-slate-200/80 animate-pulse" />
              <div className="h-4 w-16 rounded-lg bg-slate-200/80 animate-pulse" />
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500">Loading live portfolio from API…</p>
      </div>
    </div>
  )
}
