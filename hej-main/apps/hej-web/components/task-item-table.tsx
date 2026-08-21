"use client"

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
import type { MockTaskItem } from "@/lib/mock-data"

type TaskItemColumn = "item" | "status" | "mode" | "value" | "signal" | "actions"

type TaskItemAction = {
  key: string
  label: string
  onClick: (item: MockTaskItem) => void
  variant?: "default" | "outline" | "ghost"
}

type TaskItemTableProps = {
  items: MockTaskItem[]
  selectedItemId: string
  onSelect: (itemId: string) => void
  onItemActivate?: (item: MockTaskItem) => void
  valueLabel?: string
  signalLabel?: string
  getHref?: (item: MockTaskItem) => string
  modeLabel?: string
  columns?: TaskItemColumn[]
  actions?: TaskItemAction[]
  getValue?: (item: MockTaskItem) => string
  getSignal?: (item: MockTaskItem) => string
}

export function TaskItemTable({
  items,
  selectedItemId,
  onSelect,
  onItemActivate,
  valueLabel = "Candidate",
  signalLabel = "Signal",
  getHref,
  modeLabel,
  columns,
  actions = [],
  getValue,
  getSignal,
}: TaskItemTableProps) {
  const router = useRouter()
  const visibleColumns = columns ?? [
    "item",
    "status",
    ...(modeLabel ? (["mode"] as TaskItemColumn[]) : []),
    "value",
    "signal",
    ...(actions.length > 0 ? (["actions"] as TaskItemColumn[]) : []),
  ]

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-900/10 dark:border-white/10">
          {visibleColumns.includes("item") ? <TableHead>Item</TableHead> : null}
          {visibleColumns.includes("status") ? <TableHead>Status</TableHead> : null}
          {visibleColumns.includes("mode") ? <TableHead>Mode</TableHead> : null}
          {visibleColumns.includes("value") ? <TableHead>{valueLabel}</TableHead> : null}
          {visibleColumns.includes("signal") ? (
            <TableHead className="text-right">{signalLabel}</TableHead>
          ) : null}
          {visibleColumns.includes("actions") ? (
            <TableHead className="text-right">Actions</TableHead>
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
                <TableCell>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {item.id}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.externalRef}
                    </p>
                  </div>
                </TableCell>
              ) : null}
              {visibleColumns.includes("status") ? (
                <TableCell>
                  <Badge variant="outline">{item.status}</Badge>
                </TableCell>
              ) : null}
              {visibleColumns.includes("mode") ? (
                <TableCell>
                  <Badge className="bg-slate-950 text-stone-100 dark:bg-white dark:text-slate-950">{modeLabel}</Badge>
                </TableCell>
              ) : null}
              {visibleColumns.includes("value") ? (
                <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                  {getValue ? getValue(item) : item.aiLabel}
                </TableCell>
              ) : null}
              {visibleColumns.includes("signal") ? (
                <TableCell className="text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                  {getSignal ? getSignal(item) : item.confidence}
                </TableCell>
              ) : null}
              {visibleColumns.includes("actions") ? (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {actions.map((action) => (
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
