"use client"

/**
 * 任务工作区 — ScopedNav（二级导航）
 *
 * 和左侧 AppShell 全局导航的区别：
 * - AppShell：Dashboard / Organizations / Projects / Admin，跨模块。
 * - ScopedNav：固定在同一 `taskId` 下切换 Overview、Setup、Items、Annotate、Review、History。
 *
 * 高亮规则：
 * - `active = pathname === item.href` 精确匹配。因此 Overview 必须是 `/tasks/xxx` 而不是带尾斜杠，
 *   子页如 `/tasks/xxx/setup` 只会高亮 Setup，不会误高亮 Overview（若改用 startsWith 则需额外排除子路径）。
 *
 * a11y：`aria-current="page"` 标记当前链接，读屏用户可感知「我在哪一个子页」。
 */
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
        // 必须与 layout 里传入的 href 完全一致（含 taskId）
        const active = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
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
