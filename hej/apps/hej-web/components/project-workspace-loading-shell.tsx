/**
 * Shared loading shell for `/projects/[projectId]/*` (layout hydration).
 */
export function ProjectWorkspaceLoadingShell() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading project workspace">
      <div className="hej-surface-dark rounded-[1.2rem] border border-slate-900/10 bg-white/84 px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-white/10">
        <div className="h-3 w-36 animate-pulse rounded bg-slate-200/80 dark:bg-white/15" />
        <div className="mt-3 h-9 max-w-sm animate-pulse rounded-lg bg-slate-200/80 dark:bg-white/15" />
        <div className="mt-3 h-4 max-w-3xl animate-pulse rounded bg-slate-200/60 dark:bg-white/10" />
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 w-24 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/12"
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 rounded-[1rem] border border-slate-900/10 bg-white/76 p-2 dark:border-white/10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 w-28 animate-pulse rounded-lg bg-slate-200/70 dark:bg-white/12"
          />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-[1.1rem] border border-slate-900/10 bg-white/80 dark:border-white/10"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-[1.3rem] border border-slate-900/10 bg-white/80 dark:border-white/10" />
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Loading live project from API…
      </p>
    </div>
  )
}
