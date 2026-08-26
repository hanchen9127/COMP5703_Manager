"use client"

import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import type { StatusVisualSegment } from "@/lib/task-status-visual"

type TaskStatusDistributionPanelProps = {
  title: string
  description: string
  segments: StatusVisualSegment[]
  total: number
  majority?: StatusVisualSegment | null
  /** Grid cards; defaults to segments. When showZeroInGrid is false, count=0 rows are hidden. */
  gridSegments?: StatusVisualSegment[]
  /** When true, render every grid segment (count=0 shown dimmed, not clickable). */
  showZeroInGrid?: boolean
  activeFilterKey?: string | null
  onSegmentClick?: (segment: StatusVisualSegment) => void
  footer?: React.ReactNode
  className?: string
}

function segmentKey(segment: StatusVisualSegment): string {
  return String(segment.status)
}

function getPercent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

export function TaskStatusDistributionPanel({
  title,
  description,
  segments,
  total,
  majority = null,
  gridSegments,
  showZeroInGrid = false,
  activeFilterKey = null,
  onSegmentClick,
  footer,
  className,
}: TaskStatusDistributionPanelProps) {
  const barSegments = segments.filter((entry) => entry.count > 0)
  const grid = gridSegments ?? segments
  const visibleGrid = showZeroInGrid ? grid : grid.filter((entry) => entry.count > 0)

  return (
    <Card
      className={cn(
        "hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10 dark:shadow-[0_12px_30px_rgba(2,6,23,0.28)]",
        className,
      )}
    >
      <CardHeader className="px-4 pb-3 md:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </CardTitle>
            <CardDescription className="mt-2 text-[15px] leading-6 text-slate-600 dark:text-slate-300">
              {description}
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-slate-900/10 bg-stone-50/88 px-4 py-3 text-right shadow-[0_8px_18px_rgba(15,23,42,0.04)] dark:border-white/10">
            <p className="text-sm text-slate-500">Current majority</p>
            <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
              {majority ? `${majority.count} ${majority.label}` : "No items"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 md:px-5">
        <div className="overflow-hidden rounded-full border border-slate-900/10 bg-stone-100 shadow-inner dark:border-white/10">
          <div className="flex h-5 w-full">
            {barSegments.length > 0 ? (
              barSegments.map((entry) => (
                <div
                  key={segmentKey(entry)}
                  className={entry.barClassName}
                  style={{
                    width: `${Math.max((entry.count / Math.max(total, 1)) * 100, 3)}%`,
                  }}
                  title={`${entry.label}: ${entry.count}`}
                />
              ))
            ) : (
              <div className="h-full w-full bg-slate-200 dark:bg-slate-700" />
            )}
          </div>
        </div>

        {visibleGrid.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleGrid.map((entry) => {
              const key = segmentKey(entry)
              const isActive =
                entry.filterKey != null && activeFilterKey != null
                  ? entry.filterKey === activeFilterKey
                  : false
              const interactive = Boolean(onSegmentClick) && entry.count > 0
              const body = (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`size-2.5 shrink-0 rounded-full ${entry.dotClassName}`} />
                      <span className="min-w-0 text-base font-semibold text-slate-700 dark:text-slate-200">
                        {entry.label}
                      </span>
                    </div>
                    <span className="text-base font-semibold text-slate-950 dark:text-slate-100">
                      {entry.count}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full border border-slate-900/10 bg-stone-100 dark:border-white/10">
                    <div
                      className={`h-full ${entry.barClassName}`}
                      style={{ width: `${getPercent(entry.count, total)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {getPercent(entry.count, total)}% of items
                  </p>
                </>
              )

              if (!interactive) {
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-2xl border border-slate-900/10 bg-white/70 px-4 py-3.5 shadow-[0_8px_18px_rgba(15,23,42,0.03)] dark:border-white/10",
                      entry.count === 0 && "opacity-50",
                    )}
                  >
                    {body}
                  </div>
                )
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSegmentClick?.(entry)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3.5 text-left shadow-[0_8px_18px_rgba(15,23,42,0.03)] transition-colors",
                    isActive
                      ? "border-slate-900 bg-slate-900/5 ring-1 ring-slate-900/20 dark:border-white dark:bg-white/10"
                      : "border-slate-900/10 bg-white/70 hover:border-slate-900/20 dark:border-white/10",
                  )}
                >
                  {body}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No items in this view yet.</p>
        )}

        {footer ? <div className="mt-4 border-t border-slate-900/10 pt-4 dark:border-white/10">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}

type OutOfScopeFooterProps = {
  segments: StatusVisualSegment[]
  reviewHref: string
}

export function TaskStatusOutOfScopeFooter({ segments, reviewHref }: OutOfScopeFooterProps) {
  if (segments.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-[13px] text-slate-600 dark:text-slate-400">
        Outside annotate queue:{" "}
        {segments.map((s) => `${s.count} ${s.label.toLowerCase()}`).join(" · ")}
      </p>
      <Link
        href={reviewHref}
        className="text-[13px] font-medium text-slate-800 underline-offset-2 hover:underline dark:text-slate-200"
      >
        Open Review
      </Link>
    </div>
  )
}
