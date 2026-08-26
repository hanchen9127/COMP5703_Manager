"use client"

/**
 * 可复用的任务条目表格
 *
 * 行为：
 * - 行点击：先 onSelect(itemId)；若提供 onItemActivate 则走面板逻辑；否则若有 getHref 则 router.push。
 * - status 列：禁止直接渲染 item.status 原始枚举，统一 formatTaskItemStatusLabel（B2）。
 *
 * 列可见性：通过 columns 数组裁剪；默认包含 item/status/value/signal，若传入 modeLabel 则插入 mode 列，若 actions 非空则加操作列。
 */
import { useRouter } from "next/navigation"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { formatTaskItemStatusLabel } from "@/lib/task-format"
import type { MockTaskItem } from "@/lib/domain/task-types"

type TaskItemColumn = "item" | "status" | "mode" | "value" | "signal" | "actions"

type TaskItemAction = {
  key: string
  label: string
  onClick: (item: MockTaskItem) => void
  variant?: "default" | "outline" | "ghost"
}

type TaskItemTableBaseProps = {
  items: MockTaskItem[]
  selectedItemId: string
  /** Shown in a single empty row when `items` is empty (scope/search/no data). */
  emptyMessage?: string
  onSelect: (itemId: string) => void
  onItemActivate?: (item: MockTaskItem) => void
  valueLabel?: string
  getHref?: (item: MockTaskItem) => string
  modeLabel?: string
  columns?: TaskItemColumn[]
  actions?: TaskItemAction[]
  /** Per-row actions based on item state; takes precedence over static `actions` */
  getActions?: (item: MockTaskItem) => TaskItemAction[]
  getValue?: (item: MockTaskItem) => string
}

type TaskItemTableSignalProps =
  | {
      signalLabel: string
      getSignal: (item: MockTaskItem) => string
    }
  | {
      signalLabel?: undefined
      getSignal?: undefined
    }

type TaskItemTableProps = TaskItemTableBaseProps & TaskItemTableSignalProps

export function TaskItemTable({
  items,
  selectedItemId,
  onSelect,
  onItemActivate,
  valueLabel = "Candidate",
  signalLabel,
  getHref,
  modeLabel,
  columns,
  actions = [],
  getActions,
  getValue,
  getSignal,
  emptyMessage,
}: TaskItemTableProps) {
  const router = useRouter()
  const hasActions = actions.length > 0 || !!getActions
  const visibleColumns = columns ?? [
    "item",
    "status",
    ...(modeLabel ? (["mode"] as TaskItemColumn[]) : []),
    "value",
    "signal",
    ...(hasActions ? (["actions"] as TaskItemColumn[]) : []),
  ]

  const emptyCopy =
    emptyMessage ?? "No items to show."
  const showSignalColumn = signalLabel !== undefined && visibleColumns.includes("signal")

  if (items.length === 0) {
    return (
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow className="border-slate-900/10 dark:border-white/10">
            {visibleColumns.includes("item") ? <TableHead>Item</TableHead> : null}
            {visibleColumns.includes("status") ? <TableHead>Status</TableHead> : null}
            {visibleColumns.includes("mode") ? <TableHead>Mode</TableHead> : null}
            {visibleColumns.includes("value") ? <TableHead>{valueLabel}</TableHead> : null}
            {showSignalColumn ? (
              <TableHead className="text-right">{signalLabel}</TableHead>
            ) : null}
            {visibleColumns.includes("actions") ? (
              <TableHead className="text-right">Actions</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="border-slate-900/10 dark:border-white/10">
            <TableCell
              colSpan={visibleColumns.length}
              className="py-10 text-center text-sm text-slate-600 dark:text-slate-400"
            >
              {emptyCopy}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  return (
    <Table className="table-fixed w-full">
      <TableHeader>
        <TableRow className="border-slate-900/10 dark:border-white/10">
          {visibleColumns.includes("item") ? <TableHead className="w-[16rem]">Item</TableHead> : null}
          {visibleColumns.includes("status") ? <TableHead className="w-[9rem]">Status</TableHead> : null}
          {visibleColumns.includes("mode") ? <TableHead className="w-[8rem]">Mode</TableHead> : null}
          {visibleColumns.includes("value") ? <TableHead className="w-[22rem]">{valueLabel}</TableHead> : null}
          {showSignalColumn ? (
            <TableHead className="w-[10rem] text-right">{signalLabel}</TableHead>
          ) : null}
          {visibleColumns.includes("actions") ? (
            <TableHead className="w-[10rem] text-right">Actions</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const active = item.id === selectedItemId
          return (
            <TableRow
              key={item.id}
              data-state={active ? "selected" : undefined}
              className={`cursor-pointer border-slate-900/10 transition-colors hover:bg-amber-50/70 dark:border-white/10 dark:hover:bg-white/10 ${active ? "bg-amber-50/80 dark:bg-white/10" : ""}`}
              onClick={() => {
                onSelect(item.id)

                if (onItemActivate) {
                  onItemActivate(item)
                  return
                }

                if (getHref) {
                  router.push(getHref(item))
                  return
                }
              }}
            >
              {visibleColumns.includes("item") ? (
                <TableCell className="min-w-0">
                  <div className="min-w-0">
                    <p className="truncate text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {item.id}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.externalRef}
                    </p>
                  </div>
                </TableCell>
              ) : null}
              {visibleColumns.includes("status") ? (
                <TableCell>
                  <Badge variant="outline">{formatTaskItemStatusLabel(item.status)}</Badge>
                </TableCell>
              ) : null}
              {visibleColumns.includes("mode") ? (
                <TableCell>
                  <Badge className="bg-slate-950 text-stone-100 dark:bg-white dark:text-slate-950">{modeLabel}</Badge>
                </TableCell>
              ) : null}
              {visibleColumns.includes("value") ? (
                <TableCell className="min-w-0 text-sm text-slate-700 dark:text-slate-300">
                  <div className="line-clamp-2 break-words">
                    {getValue ? getValue(item) : item.aiLabel}
                  </div>
                </TableCell>
              ) : null}
              {showSignalColumn ? (
                <TableCell className="whitespace-nowrap text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                  {getSignal ? getSignal(item) : item.confidence}
                </TableCell>
              ) : null}
              {visibleColumns.includes("actions") ? (
                <TableCell className="whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    {(getActions ? getActions(item) : actions).map((action) => (
                      <Button
                        key={`${item.id}-${action.key}`}
                        type="button"
                        size="sm"
                        variant={action.variant ?? "outline"}
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelect(item.id)
                          action.onClick(item)
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
