"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

type TaskSetupCollapsibleSectionProps = {
  title: string
  description?: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function TaskSetupCollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
  className = "",
}: TaskSetupCollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      className={`hej-surface-dark overflow-hidden rounded-[1.25rem] border border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10 ${className}`.trim()}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left md:px-5"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
        {open ? (
          <ChevronDown className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
        ) : (
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
        )}
      </button>
      {open ? (
        <div className="border-t border-slate-900/10 px-4 pb-4 pt-3 dark:border-white/10 md:px-5">
          {children}
        </div>
      ) : null}
    </section>
  )
}
