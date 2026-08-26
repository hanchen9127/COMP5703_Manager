/**
 * Shared loading shell for `/tasks/[taskId]/*` (layout hydration).
 */
export function TaskWorkspaceLoadingShell() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading task workspace">
      <div className="hej-surface-dark rounded-[1.2rem] border border-slate-900/10 bg-white/84 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-white/10">
        <div className="h-3 w-28 animate-pulse rounded bg-slate-200/80 dark:bg-white/15" />
        <div className="mt-4 h-8 max-w-md animate-pulse rounded-lg bg-slate-200/80 dark:bg-white/15" />
        <div className="mt-3 h-4 max-w-2xl animate-pulse rounded bg-slate-200/60 dark:bg-white/10" />
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-7 w-20 animate-pulse rounded-md bg-slate-200/70 dark:bg-white/12"
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 rounded-[1rem] border border-slate-900/10 bg-white/76 p-2 dark:border-white/10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-lg bg-slate-200/70 dark:bg-white/12"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-[1.25rem] border border-slate-900/10 bg-white/80 dark:border-white/10" />
        <div className="h-40 animate-pulse rounded-[1.25rem] border border-slate-900/10 bg-white/80 dark:border-white/10" />
      </div>
      <div className="h-48 animate-pulse rounded-[1.25rem] border border-slate-900/10 bg-white/80 dark:border-white/10" />
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Loading live task from API…
      </p>
    </div>
  )
}
