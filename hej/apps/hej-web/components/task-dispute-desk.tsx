"use client"

/**
 * Task-level dispute desk.
 *
 * Lists **open** escalations for one task (real backend via
 * `listTaskEscalations`) and lets a secondary reviewer / expert close
 * each one with a decision: `finalize` or `send_back`.
 * Decisions go through `decideTaskItemEscalation`, which updates the
 * underlying task item's status on the backend.
 *
 * Falls back to a friendly empty state when there is no token or the
 * backend is unreachable, mirroring other client wrappers under
 * `components/*-with-real-data`.
 */
import { useCallback, useEffect, useState } from "react"

import { useTaskWorkspace } from "@/components/task-workspace-client-shell"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  decideTaskItemEscalation,
  listTaskEscalations,
  type EscalationListItemBody,
} from "@/lib/api/review-actions"
import { formatApiDatetimeLocal } from "@/lib/format-api-datetime"
import {
  formatTaskItemDisplayLabel,
  taskItemIdSecondaryLabel,
} from "@/lib/task-item-display-label"

type Feedback = {
  kind: "error" | "success"
  message: string
}

type DecisionDraft = {
  decision: "finalize" | "send_back"
  note: string
}

type Props = {
  taskId: string
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—"
  return formatApiDatetimeLocal(iso)
}

export function TaskDisputeDesk({ taskId }: Props) {
  const { retry } = useTaskWorkspace()
  const [rows, setRows] = useState<EscalationListItemBody[] | null>(null)
  const [drafts, setDrafts] = useState<Record<string, DecisionDraft>>({})
  const [pending, setPending] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoadError(null)
    const result = await listTaskEscalations(taskId)
    if (!result.ok) {
      if (result.error.status === 404) {
        setRows([])
        return
      }
      setRows([])
      setLoadError(result.error.message)
      return
    }
    setRows(result.data.items)
  }, [taskId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function setDraft(itemId: string, patch: Partial<DecisionDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: {
        decision: prev[itemId]?.decision ?? "finalize",
        note: prev[itemId]?.note ?? "",
        ...patch,
      },
    }))
  }

  async function submitDecision(itemId: string) {
    const draft = drafts[itemId] ?? { decision: "finalize", note: "" }
    if (draft.decision === "send_back") {
      setFeedback({
        kind: "error",
        message: "Send back to annotator is not wired yet. Please use Finalize for now.",
      })
      return
    }
    setPending(itemId)
    setFeedback(null)
    const result = await decideTaskItemEscalation(taskId, itemId, {
      decision: draft.decision,
      note: draft.note.trim() || null,
      payload_preview: null,
    })
    setPending(null)
    if (!result.ok) {
      setFeedback({ kind: "error", message: result.error.message })
      return
    }
    setFeedback({
      kind: "success",
      message: `Escalation resolved (${draft.decision}) → ${result.data.next_status}.`,
    })
    await refresh()
    await retry()
  }

  if (rows === null) {
    return (
      <div className="rounded-xl border border-slate-900/10 bg-stone-50/70 p-6 text-sm text-slate-600">
        Loading dispute desk…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Open escalations</h2>
          <p className="text-[13px] text-slate-600">
            Items routed for secondary review. Close each one with finalize or send back to annotator.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Could not load escalations: {loadError}
        </div>
      ) : null}

      {feedback ? (
        <div
          role="alert"
          className={
            feedback.kind === "error"
              ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
              : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          }
        >
          <p>{feedback.message}</p>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-900/15 bg-stone-50/80 p-8 text-center">
          <p className="text-sm font-medium text-slate-900">No open escalations</p>
          <p className="mt-1 text-[13px] text-slate-600">
            Escalated items will appear here as reviewers route them from the work panel.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const draft = drafts[row.task_item_id] ?? {
              decision: "finalize" as const,
              note: "",
            }
            const isPending = pending === row.task_item_id
            return (
              <li
                key={row.task_item_id}
                className="rounded-xl border border-slate-900/10 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-semibold">
                    {formatTaskItemDisplayLabel({
                      taskItemId: row.task_item_id,
                      externalItemRef: row.external_item_ref,
                    })}
                  </Badge>
                  {taskItemIdSecondaryLabel({
                    taskItemId: row.task_item_id,
                    externalItemRef: row.external_item_ref,
                  }) ? (
                    <span className="font-mono text-[11px] text-slate-500">
                      {row.task_item_id}
                    </span>
                  ) : null}
                  <Badge className="bg-slate-900 text-white">{row.target ?? "secondary_reviewer"}</Badge>
                  <span className="text-[12px] text-slate-500">
                    Routed {fmtDateTime(row.routed_at)}
                    {row.assignee_ref ? ` · to ${row.assignee_ref}` : ""}
                  </span>
                </div>
                {row.note ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{row.note}</p>
                ) : null}

                <div className="mt-3 grid gap-3 md:grid-cols-[200px_1fr_auto]">
                  <label className="text-[13px] text-slate-700">
                    Decision
                    <select
                      className="mt-1 w-full rounded-md border border-slate-900/10 bg-white px-2 py-1.5 text-sm"
                      value={draft.decision}
                      onChange={(e) => {
                        const nextDecision = e.target.value as DecisionDraft["decision"]
                        if (nextDecision === "send_back") {
                          setFeedback({
                            kind: "error",
                            message:
                              "Send back to annotator is not wired yet. This option is currently a placeholder.",
                          })
                          setDraft(row.task_item_id, { decision: "finalize" })
                          return
                        }
                        setDraft(row.task_item_id, { decision: nextDecision })
                      }}
                    >
                      <option value="finalize">Finalize (canonicalize)</option>
                      <option value="send_back">Send back to annotator</option>
                    </select>
                  </label>
                  <label className="text-[13px] text-slate-700">
                    Note (optional)
                    <Textarea
                      className="mt-1"
                      rows={2}
                      value={draft.note}
                      onChange={(e) =>
                        setDraft(row.task_item_id, { note: e.target.value })
                      }
                      placeholder="Why this decision?"
                    />
                  </label>
                  <div className="flex items-end">
                    <Button
                      onClick={() => void submitDecision(row.task_item_id)}
                      disabled={isPending}
                    >
                      {isPending ? "Submitting…" : "Submit decision"}
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
