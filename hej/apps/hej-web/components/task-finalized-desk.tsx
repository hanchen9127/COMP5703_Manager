"use client"

/**
 * Task-level finalized desk.
 *
 * Reads `listFinalizedTaskItems` (real backend) and renders the
 * canonicalized items table for one task. Read-only.
 */
import { useCallback, useEffect, useState } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  listFinalizedTaskItems,
  type FinalizedTaskItemReadBody,
} from "@/lib/api/review-actions"
import { getTaskAnnotationExportNormalized } from "@/lib/api/exports"
import { formatApiDatetimeLocal } from "@/lib/format-api-datetime"
import {
  formatTaskItemDisplayLabel,
  taskItemIdSecondaryLabel,
} from "@/lib/task-item-display-label"

type Props = {
  taskId: string
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—"
  return formatApiDatetimeLocal(iso)
}

export function TaskFinalizedDesk({ taskId }: Props) {
  const [rows, setRows] = useState<FinalizedTaskItemReadBody[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const hasFinalizedRows = Array.isArray(rows) && rows.length > 0

  const refresh = useCallback(async () => {
    setLoadError(null)
    const result = await listFinalizedTaskItems(taskId)
    if (!result.ok) {
      setRows([])
      setLoadError(result.error.message)
      return
    }
    setRows(result.data.items)
  }, [taskId])

  const exportJson = useCallback(async () => {
    setExportError(null)
    if (!hasFinalizedRows) {
      setExportError("Export is available after at least one item is finalized.")
      return
    }

    setIsExporting(true)
    try {
      const result = await getTaskAnnotationExportNormalized(taskId)
      if (!result.ok) {
        setExportError(result.error.message)
        return
      }

      const data = result.data
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `task-${taskId}-annotations-normalized.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Failed to export annotations. Please try again.",
      )
    } finally {
      setIsExporting(false)
    }
  }, [hasFinalizedRows, taskId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (rows === null) {
    return (
      <div className="rounded-xl border border-slate-900/10 bg-stone-50/70 p-6 text-sm text-slate-600">
        Loading finalized items…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Finalized items</h2>
          <p className="text-[13px] text-slate-600">
            Items canonicalized by the dispute desk; this list is the canonical export source for this task.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void exportJson()}
            disabled={isExporting || !hasFinalizedRows}
          >
            {isExporting ? "Exporting..." : "Export JSON"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Refresh
          </Button>
        </div>
      </div>

      {!hasFinalizedRows ? (
        <p className="text-[13px] text-slate-500">
          Export is available after at least one item is finalized.
        </p>
      ) : null}

      {loadError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Could not load finalized items: {loadError}
        </div>
      ) : null}

      {exportError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {exportError}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-900/15 bg-stone-50/80 p-8 text-center">
          <p className="text-sm font-medium text-slate-900">No finalized items yet</p>
          <p className="mt-1 text-[13px] text-slate-600">
            Resolve an open escalation with the `finalize` decision to move an item here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-lg border border-slate-900/10 bg-white px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[11px] font-semibold">
                  {formatTaskItemDisplayLabel({
                    taskItemId: row.id,
                    externalItemRef: row.external_item_ref,
                  })}
                </Badge>
                {taskItemIdSecondaryLabel({
                  taskItemId: row.id,
                  externalItemRef: row.external_item_ref,
                }) ? (
                  <span className="font-mono text-[11px] text-slate-500">{row.id}</span>
                ) : null}
                <Badge className="bg-emerald-600 text-white">{row.status}</Badge>
              </div>
              <span className="text-[12px] text-slate-500">
                Finalized {fmtDateTime(row.finalized_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
