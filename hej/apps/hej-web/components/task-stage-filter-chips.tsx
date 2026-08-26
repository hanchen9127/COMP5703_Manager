"use client"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import type { ItemsFilterChip } from "@/lib/task-stage-kpis"

type TaskStageFilterChipsProps = {
  chips: ItemsFilterChip[]
  activeKey: string | null
  onChange: (key: string | null) => void
  className?: string
}

export function TaskStageFilterChips({
  chips,
  activeKey,
  onChange,
  className,
}: TaskStageFilterChipsProps) {
  return (
    <section
      aria-label="Item inventory by lifecycle"
      className={cn(
        "rounded-xl border border-slate-900/10 bg-white/80 p-3 dark:border-white/10",
        className,
      )}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        Inventory by status
      </p>
      <p className="mb-3 text-[13px] leading-5 text-slate-600 dark:text-slate-400">
        Tap a group to filter the table below. Overview keeps the task-wide summary; this view is
        your full item catalog.
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = activeKey === chip.key
          return (
            <button
              key={chip.key ?? "all"}
              type="button"
              onClick={() => onChange(chip.key)}
              className="cursor-pointer"
            >
              <Badge
                variant={active ? "default" : "outline"}
                className={cn("gap-1.5 px-2.5 py-1", active && "bg-slate-900 text-stone-100")}
              >
                <span>{chip.label}</span>
                <span
                  className={cn(
                    "rounded-md px-1.5 text-[11px] font-semibold tabular-nums",
                    active ? "bg-white/20" : "bg-stone-100 text-slate-700 dark:bg-white/10",
                  )}
                >
                  {chip.count}
                </span>
              </Badge>
            </button>
          )
        })}
      </div>
    </section>
  )
}
