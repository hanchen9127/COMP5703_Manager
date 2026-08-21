"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

type ScopedNavItem = {
  href: string
  label: string
}

type ScopedNavProps = {
  items: ScopedNavItem[]
}

export function ScopedNav({ items }: ScopedNavProps) {
  const pathname = usePathname()

  return (
    <div className="hej-surface-dark flex flex-wrap gap-2 rounded-[1rem] border border-slate-900/10 bg-white/76 p-2 shadow-[0_8px_22px_rgba(15,23,42,0.04)] dark:border-white/10 dark:shadow-[0_10px_28px_rgba(2,6,23,0.28)]">
      {items.map((item) => {
        const active = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-slate-950 text-stone-100 dark:bg-white dark:text-slate-950"
                : "text-slate-700 hover:bg-stone-100 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
