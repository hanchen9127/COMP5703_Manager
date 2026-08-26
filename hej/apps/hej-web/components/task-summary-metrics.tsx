"use client"

import Link from "next/link"
import {
  AlertTriangle,
  AppWindow,
  CircleCheckBig,
  CirclePlay,
  CircleX,
  DatabaseZap,
  FileCheck2,
  GitBranchPlus,
  ListTodo,
  LoaderCircle,
  PencilLine,
  RotateCcw,
  Scale,
  Tags,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

export type TaskSummaryMetricIconName =
  | "alert-triangle"
  | "app-window"
  | "circle-check"
  | "circle-play"
  | "circle-x"
  | "database-zap"
  | "file-check"
  | "git-branch"
  | "list-todo"
  | "loader-circle"
  | "pencil-line"
  | "rotate-ccw"
  | "scale"
  | "tags"

export type TaskSummaryMetric = {
  label: string
  value: string
  iconName: TaskSummaryMetricIconName
  key?: string
  href?: string
  filterKey?: string | null
  hint?: string
}

type TaskSummaryMetricsProps = {
  items: TaskSummaryMetric[]
  columnsClassName?: string
  expandable?: boolean
  detailItems?: TaskSummaryMetric[]
  narrative?: string
  /** Matches `metric.filterKey` when set (stage tabs). */
  activeFilterKey?: string | null
  onMetricClick?: (metric: TaskSummaryMetric) => void
}

const iconMap: Record<TaskSummaryMetricIconName, LucideIcon> = {
  "alert-triangle": AlertTriangle,
  "app-window": AppWindow,
  "circle-check": CircleCheckBig,
  "circle-play": CirclePlay,
  "circle-x": CircleX,
  "database-zap": DatabaseZap,
  "file-check": FileCheck2,
  "git-branch": GitBranchPlus,
  "list-todo": ListTodo,
  "loader-circle": LoaderCircle,
  "pencil-line": PencilLine,
  "rotate-ccw": RotateCcw,
  scale: Scale,
  tags: Tags,
}

function metricIdentity(metric: TaskSummaryMetric): string {
  return metric.key ?? metric.label
}

function isMetricActive(metric: TaskSummaryMetric, activeFilterKey: string | null | undefined): boolean {
  if (metric.filterKey != null && activeFilterKey != null) {
    return metric.filterKey === activeFilterKey
  }
  return false
}

function SummaryMetricCard({
  metric,
  activeFilterKey,
  onMetricClick,
}: {
  metric: TaskSummaryMetric
  activeFilterKey?: string | null
  onMetricClick?: (metric: TaskSummaryMetric) => void
}) {
  const active = isMetricActive(metric, activeFilterKey)
  const Icon = iconMap[metric.iconName]
  const interactive = Boolean(metric.href || (onMetricClick && metric.filterKey != null))
  const cardClass = cn(
    "hej-surface-dark gap-3 rounded-[1.1rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:shadow-[0_12px_30px_rgba(2,6,23,0.28)]",
    interactive && "transition-shadow hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]",
    active && "ring-2 ring-slate-900/25 dark:ring-white/25",
  )

  const inner = (
    <>
      <CardHeader className="px-4 md:px-5">
        <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {metric.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between px-4 md:px-5">
        <p className="text-sm font-semibold tabular-nums text-slate-950 dark:text-slate-100">
          {metric.value}
        </p>
        <div className="rounded-lg bg-slate-900 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
          <Icon className="size-3.5" />
        </div>
      </CardContent>
    </>
  )

  if (metric.href) {
    return (
      <Link href={metric.href} className={cardClass} title={metric.hint}>
        <Card className="h-full border-0 bg-transparent shadow-none">{inner}</Card>
      </Link>
    )
  }

  if (onMetricClick && metric.filterKey !== undefined) {
    return (
      <button
        type="button"
        className={cn(cardClass, "w-full text-left")}
        title={metric.hint}
        onClick={() => onMetricClick(metric)}
      >
        <Card className="h-full border-0 bg-transparent shadow-none">{inner}</Card>
      </button>
    )
  }

  return (
    <Card className={cardClass} title={metric.hint}>
      {inner}
    </Card>
  )
}

export function TaskSummaryMetrics({
  items,
  columnsClassName = "md:grid-cols-4",
  expandable = false,
  detailItems = [],
  narrative,
  activeFilterKey = null,
  onMetricClick,
}: TaskSummaryMetricsProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="space-y-3">
      <section className={`grid gap-3 ${columnsClassName}`}>
        {items.map((metric) => (
          <SummaryMetricCard
            key={metricIdentity(metric)}
            metric={metric}
            activeFilterKey={activeFilterKey}
            onMetricClick={onMetricClick}
          />
        ))}
      </section>

      {narrative ? (
        <p className="text-[13px] leading-5 text-slate-600 dark:text-slate-400">{narrative}</p>
      ) : null}

      {expandable && detailItems.length > 0 ? (
        <div className="rounded-xl border border-slate-900/10 bg-white/80 p-3 dark:border-white/10">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setShowDetails((current) => !current)}
          >
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {showDetails ? "Hide status breakdown" : "Show status breakdown"}
            </span>
            {showDetails ? (
              <ChevronDown className="size-4 text-slate-500" />
            ) : (
              <ChevronRight className="size-4 text-slate-500" />
            )}
          </button>
          {showDetails ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {detailItems.map((metric) => {
                const Icon = iconMap[metric.iconName]
                return (
                  <div
                    key={metricIdentity(metric)}
                    className="flex items-center justify-between rounded-xl border border-slate-900/10 bg-stone-50/88 px-3 py-2.5 dark:border-white/10"
                    title={metric.hint}
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">{metric.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-slate-950 dark:text-slate-100">
                        {metric.value}
                      </span>
                      <Icon className="size-3.5 text-slate-500" />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
