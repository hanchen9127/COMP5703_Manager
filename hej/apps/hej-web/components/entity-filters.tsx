"use client"

import { Search, SlidersHorizontal } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

type EntityFiltersProps = {
  title: string
  query: string
  onQueryChange: (value: string) => void
  visibleCount: number
  placeholder: string
  options: string[]
  activeOption: string
  onOptionChange: (value: string) => void
}

export function EntityFilters({
  title,
  query,
  onQueryChange,
  visibleCount,
  placeholder,
  options,
  activeOption,
  onOptionChange,
}: EntityFiltersProps) {
  return (
    <div className="hej-surface-soft flex flex-col gap-3 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          <SlidersHorizontal className="size-4" />
          {title}
        </div>
        <Badge variant="outline">{visibleCount} visible</Badge>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          className="hej-surface-soft bg-white pl-9 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-400"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option === activeOption

          return (
            <Button
              key={option}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              className={cn(
                active
                  ? "bg-slate-900 text-stone-100 dark:bg-white dark:text-slate-950"
                  : "hej-surface-soft bg-white/90 dark:border-white/10 dark:text-slate-300"
              )}
              onClick={() => onOptionChange(option)}
            >
              {option}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
