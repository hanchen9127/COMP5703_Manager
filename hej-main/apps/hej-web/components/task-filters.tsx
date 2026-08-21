"use client"

import { Search, SlidersHorizontal } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"

type TaskFiltersProps = {
  query: string
  onQueryChange: (value: string) => void
  activeCount: number
  statusOptions?: string[]
}

export function TaskFilters({
  query,
  onQueryChange,
  activeCount,
  statusOptions = [],
}: TaskFiltersProps) {
  return (
    <div className="hej-surface-soft flex flex-col gap-3 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          <SlidersHorizontal className="size-4" />
          Task item filters
        </div>
        <Badge variant="outline">{activeCount} visible</Badge>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search task items or external refs"
          className="hej-surface-soft bg-white pl-9 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-400"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((label) => (
          <Badge key={label} variant="outline">
            {label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
