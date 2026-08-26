"use client"

/**
 * Stage-scoped filter UI for task item lists.
 *
 * Accepts `filterOptions` (StageFilterOption[]) so each page controls
 * which filters are visible. `showAll` toggles the generic "All" tab.
 */
import { Search, SlidersHorizontal } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import type { StageFilterOption } from "@/lib/task-format"

type TaskFiltersProps = {
  query: string
  onQueryChange: (value: string) => void
  activeCount: number
  filterOptions?: StageFilterOption[]
  activeFilter?: string | null
  onFilterChange?: (key: string | null) => void
  /** Show a generic "All" tab before the filter options (default true) */
  showAll?: boolean
}

export function TaskFilters({
  query,
  onQueryChange,
  activeCount,
  filterOptions = [],
  activeFilter = null,
  onFilterChange,
  showAll = true,
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
      {filterOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {showAll && (
            <button
              type="button"
              onClick={() => onFilterChange?.(null)}
              className="cursor-pointer"
            >
              <Badge variant={activeFilter === null ? "default" : "outline"}>
                All
              </Badge>
            </button>
          )}
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onFilterChange?.(activeFilter === option.key ? null : option.key)}
              className="cursor-pointer"
            >
              <Badge variant={activeFilter === option.key ? "default" : "outline"}>
                {option.label}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
