"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

export type TextSpanDraft = {
  id: string
  start_offset: number
  end_offset: number
  text: string
  label: string
  notes?: string
}

export type TextSpanAnnotatorProps = {
  sourceText: string
  spans: TextSpanDraft[]
  onChange: (spans: TextSpanDraft[]) => void
  disabled?: boolean
  labelOptions?: string[]
}

type TextSpanSelection = {
  start: number
  end: number
  text: string
}

type HighlightSegment =
  | { kind: "text"; key: string; value: string }
  | { kind: "span"; key: string; id: string; value: string; label: string }

type TextSpanTone = {
  markClassName: string
  badgeClassName: string
  buttonClassName: string
}

const TEXT_SPAN_TONES: TextSpanTone[] = [
  {
    markClassName:
      "rounded bg-emerald-200/70 px-0.5 text-emerald-950 dark:bg-emerald-300/30 dark:text-emerald-50",
    badgeClassName:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
    buttonClassName:
      "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100 dark:hover:bg-emerald-400/20",
  },
  {
    markClassName:
      "rounded bg-amber-200/70 px-0.5 text-amber-950 dark:bg-amber-300/30 dark:text-amber-50",
    badgeClassName:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
    buttonClassName:
      "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100 dark:hover:bg-amber-400/20",
  },
  {
    markClassName:
      "rounded bg-sky-200/70 px-0.5 text-sky-950 dark:bg-sky-300/30 dark:text-sky-50",
    badgeClassName:
      "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200",
    buttonClassName:
      "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-100 dark:hover:bg-sky-400/20",
  },
  {
    markClassName:
      "rounded bg-violet-200/70 px-0.5 text-violet-950 dark:bg-violet-300/30 dark:text-violet-50",
    badgeClassName:
      "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-200",
    buttonClassName:
      "border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-100 dark:hover:bg-violet-400/20",
  },
  {
    markClassName:
      "rounded bg-rose-200/70 px-0.5 text-rose-950 dark:bg-rose-300/30 dark:text-rose-50",
    badgeClassName:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200",
    buttonClassName:
      "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-100 dark:hover:bg-rose-400/20",
  },
  {
    markClassName:
      "rounded bg-cyan-200/70 px-0.5 text-cyan-950 dark:bg-cyan-300/30 dark:text-cyan-50",
    badgeClassName:
      "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200",
    buttonClassName:
      "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100 dark:hover:bg-cyan-400/20",
  },
  {
    markClassName:
      "rounded bg-lime-200/70 px-0.5 text-lime-950 dark:bg-lime-300/30 dark:text-lime-50",
    badgeClassName:
      "border-lime-300 bg-lime-50 text-lime-700 dark:border-lime-400/30 dark:bg-lime-400/10 dark:text-lime-200",
    buttonClassName:
      "border-lime-300 bg-lime-50 text-lime-800 hover:bg-lime-100 dark:border-lime-400/30 dark:bg-lime-400/10 dark:text-lime-100 dark:hover:bg-lime-400/20",
  },
  {
    markClassName:
      "rounded bg-fuchsia-200/70 px-0.5 text-fuchsia-950 dark:bg-fuchsia-300/30 dark:text-fuchsia-50",
    badgeClassName:
      "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/30 dark:bg-fuchsia-400/10 dark:text-fuchsia-200",
    buttonClassName:
      "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800 hover:bg-fuchsia-100 dark:border-fuchsia-400/30 dark:bg-fuchsia-400/10 dark:text-fuchsia-100 dark:hover:bg-fuchsia-400/20",
  },
  {
    markClassName:
      "rounded bg-orange-200/70 px-0.5 text-orange-950 dark:bg-orange-300/30 dark:text-orange-50",
    badgeClassName:
      "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-200",
    buttonClassName:
      "border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-100 dark:hover:bg-orange-400/20",
  },
  {
    markClassName:
      "rounded bg-indigo-200/70 px-0.5 text-indigo-950 dark:bg-indigo-300/30 dark:text-indigo-50",
    badgeClassName:
      "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-200",
    buttonClassName:
      "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-100 dark:hover:bg-indigo-400/20",
  },
]

function getStableLabelColorIndex(label: string, paletteSize: number) {
  const normalized = label.trim().toLowerCase()
  if (paletteSize <= 0) return 0

  let hash = 0
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0
  }

  return hash % paletteSize
}

function getTextSpanLabelTone(label: string): TextSpanTone {
  return TEXT_SPAN_TONES[getStableLabelColorIndex(label, TEXT_SPAN_TONES.length)] ?? TEXT_SPAN_TONES[0]!
}

function newLocalSpanId() {
  return `span_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeLabel(value: string) {
  return value.trim()
}

function normalizeLabelKey(value: string) {
  return value.trim().toLowerCase()
}

function mergeLabels(baseLabels: string[] | undefined, customLabels: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const label of [...(baseLabels ?? []), ...customLabels]) {
    const normalized = normalizeLabel(label)
    const key = normalizeLabelKey(normalized)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }

  return result
}

function labelExists(labels: string[], label: string) {
  return labels.some((existing) => normalizeLabelKey(existing) === normalizeLabelKey(label))
}

function getTextOffsetWithinNode(root: HTMLSpanElement, targetNode: Node, targetOffset: number): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let offset = 0
  let current = walker.nextNode()

  while (current) {
    if (current === targetNode) {
      return offset + targetOffset
    }
    offset += current.textContent?.length ?? 0
    current = walker.nextNode()
  }

  return -1
}

function getSelectionFromRoot(root: HTMLSpanElement, sourceText: string): TextSpanSelection | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null

  const range = selection.getRangeAt(0)
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null

  const rawStart = getTextOffsetWithinNode(root, range.startContainer, range.startOffset)
  const rawEnd = getTextOffsetWithinNode(root, range.endContainer, range.endOffset)
  if (rawStart < 0 || rawEnd < 0) return null

  const start = Math.min(rawStart, rawEnd)
  const end = Math.max(rawStart, rawEnd)
  if (start >= end) return null

  return { start, end, text: sourceText.slice(start, end) }
}

function isHighlightable(span: TextSpanDraft, sourceText: string, cursor: number) {
  return (
    span.start_offset >= 0 &&
    span.end_offset > span.start_offset &&
    span.end_offset <= sourceText.length &&
    span.start_offset >= cursor
  )
}

function buildSegments(sourceText: string, spans: TextSpanDraft[]): HighlightSegment[] {
  const sorted = [...spans].sort((left, right) => {
    if (left.start_offset !== right.start_offset) return left.start_offset - right.start_offset
    return left.end_offset - right.end_offset
  })

  const segments: HighlightSegment[] = []
  let cursor = 0

  for (const span of sorted) {
    if (!isHighlightable(span, sourceText, cursor)) continue

    if (cursor < span.start_offset) {
      segments.push({
        kind: "text",
        key: `t_${cursor}_${span.start_offset}`,
        value: sourceText.slice(cursor, span.start_offset),
      })
    }

    segments.push({
      kind: "span",
      key: span.id,
      id: span.id,
      value: sourceText.slice(span.start_offset, span.end_offset),
      label: span.label,
    })
    cursor = span.end_offset
  }

  if (cursor < sourceText.length) {
    segments.push({ kind: "text", key: `t_${cursor}_${sourceText.length}`, value: sourceText.slice(cursor) })
  }

  return segments
}

function getWarning(span: TextSpanDraft, sourceText: string | null): string | null {
  if (!sourceText) return null
  if (span.start_offset < 0 || span.end_offset <= span.start_offset || span.end_offset > sourceText.length) {
    return "Out of bounds"
  }
  return null
}

function getSelectedText(span: TextSpanDraft, sourceText: string) {
  if (typeof span.text === "string" && span.text.trim()) return span.text
  if (span.start_offset >= 0 && span.end_offset <= sourceText.length && span.end_offset > span.start_offset) {
    return sourceText.slice(span.start_offset, span.end_offset)
  }
  return "(unavailable)"
}

export function TextSpanAnnotator({
  sourceText,
  spans,
  onChange,
  disabled,
  labelOptions,
}: TextSpanAnnotatorProps) {
  const textRootRef = useRef<HTMLSpanElement | null>(null)
  const [selection, setSelection] = useState<TextSpanSelection | null>(null)
  const [customLabel, setCustomLabel] = useState("")
  const [customQuickLabels, setCustomQuickLabels] = useState<string[]>([])
  const [editingSpanId, setEditingSpanId] = useState<string | null>(null)
  const [localLabel, setLocalLabel] = useState("")

  const sortedSpans = useMemo(
    () => [...spans].sort((a, b) => a.start_offset - b.start_offset || a.end_offset - b.end_offset),
    [spans],
  )
  const segments = useMemo(() => buildSegments(sourceText, sortedSpans), [sourceText, sortedSpans])

  const currentLabel = normalizeLabel(customLabel)
  const displayedLabels = useMemo(
    () => mergeLabels(labelOptions, customQuickLabels),
    [customQuickLabels, labelOptions],
  )
  const canAdd = Boolean(selection && selection.start < selection.end && currentLabel)

  const updateSelection = useCallback(() => {
    if (disabled) return
    const root = textRootRef.current
    if (!root) {
      setSelection(null)
      return
    }
    setSelection(getSelectionFromRoot(root, sourceText))
  }, [disabled, sourceText])

  useEffect(() => {
    setSelection(null)
    setEditingSpanId(null)
    setLocalLabel("")
    setCustomLabel("")
    setCustomQuickLabels([])
  }, [sourceText])

  const addSpan = useCallback(
    (label: string, options?: { promoteLabel?: boolean }) => {
      if (disabled) return
      if (!selection || selection.start >= selection.end) return
      const normalized = normalizeLabel(label)
      if (!normalized) return
      const nextSpan: TextSpanDraft = {
        id: newLocalSpanId(),
        start_offset: selection.start,
        end_offset: selection.end,
        text: selection.text,
        label: normalized,
      }
      onChange([...spans, nextSpan])
      if (options?.promoteLabel && !labelExists(displayedLabels, normalized)) {
        setCustomQuickLabels((current) => [...current, normalized])
      }
      setSelection(null)
      setCustomLabel("")
    },
    [disabled, displayedLabels, onChange, selection, spans],
  )

  const updateSpan = useCallback(
    (spanId: string, patch: Partial<TextSpanDraft>) => {
      onChange(spans.map((span) => (span.id === spanId ? { ...span, ...patch } : span)))
    },
    [onChange, spans],
  )

  const removeSpan = useCallback(
    (spanId: string) => {
      onChange(spans.filter((span) => span.id !== spanId))
      setEditingSpanId((current) => (current === spanId ? null : current))
    },
    [onChange, spans],
  )

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Text span annotator</p>
          {disabled ? <p className="text-xs text-slate-500">Editing disabled</p> : null}
        </div>

        <div className="mt-3 rounded-xl border border-slate-900/10 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-slate-950/30">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Source text — select here to annotate</p>
            <p className="text-[12px] text-slate-500">Use this panel to select text and add spans</p>
          </div>
          <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-[13px] leading-6 text-slate-800 dark:bg-slate-950/40 dark:text-slate-100">
            <span
              ref={textRootRef}
              onPointerUp={updateSelection}
              onMouseUp={updateSelection}
              onKeyUp={updateSelection}
              className="outline-none"
              tabIndex={0}
            >
              {segments.map((segment) => {
                if (segment.kind === "text") {
                  return <span key={segment.key}>{segment.value}</span>
                }

                const tone = getTextSpanLabelTone(segment.label)
                return (
                  <mark key={segment.key} className={tone.markClassName} title={segment.label}>
                    {segment.value}
                  </mark>
                )
              })}
            </span>
          </pre>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-900/10 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/5">
          {selection ? (
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-slate-700">
                Selected {selection.start}–{selection.end}
              </p>
              <p className="max-w-full break-words text-sm leading-5 text-slate-600 line-clamp-2">
                {selection.text}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Select text above and choose a label to add one.</p>
          )}

          {selection ? (
            <Badge variant="outline" className="border-slate-900/10 bg-slate-50 text-slate-700">
              Ready to add
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-900/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center gap-2">
          {displayedLabels.length ? (
            displayedLabels.map((label) => {
              const tone = getTextSpanLabelTone(label)
              return (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || !selection}
                  className={tone.buttonClassName}
                  onClick={() => addSpan(label)}
                >
                  {label}
                </Button>
              )
            })
          ) : null}
          <Input
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
            placeholder="Custom label"
            disabled={disabled}
            className="max-w-44"
          />
          <Button type="button" disabled={disabled || !canAdd} onClick={() => addSpan(currentLabel, { promoteLabel: true })}>
            Add custom span
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {sortedSpans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-900/15 bg-stone-50/70 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5">
            No spans yet. Select text above and choose a label to add one.
          </div>
        ) : null}
        {sortedSpans.map((span, index) => {
          const warning = getWarning(span, sourceText)
          const overlapWarning =
            index > 0 && span.start_offset < sortedSpans[index - 1]!.end_offset
              ? "Overlapping"
              : null
          const tone = getTextSpanLabelTone(span.label)
          return (
            <div
              key={span.id}
              className="rounded-xl border border-slate-900/10 bg-white/80 p-3 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={tone.badgeClassName}>
                  {span.label}
                </Badge>
                <span className="text-xs text-slate-500">
                  {span.start_offset}–{span.end_offset}
                </span>
                {warning ? (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                    {warning}
                  </Badge>
                ) : null}
                {overlapWarning ? (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                    {overlapWarning}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-700 dark:text-slate-200">
                {getSelectedText(span, sourceText)}
              </p>
              <div className="mt-3 grid gap-2">
                <Textarea
                  value={span.notes ?? ""}
                  disabled={disabled}
                  onChange={(event) => updateSpan(span.id, { notes: event.target.value })}
                  placeholder="Notes"
                  className="min-h-20"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={editingSpanId === span.id ? localLabel : span.label}
                    disabled={disabled}
                    onChange={(event) => {
                      setEditingSpanId(span.id)
                      setLocalLabel(event.target.value)
                    }}
                    onBlur={() => {
                      if (editingSpanId === span.id) {
                        const nextLabel = normalizeLabel(localLabel) || span.label
                        updateSpan(span.id, { label: nextLabel })
                        if (!labelExists(displayedLabels, nextLabel)) {
                          setCustomQuickLabels((current) => [...current, nextLabel])
                        }
                        setEditingSpanId(null)
                        setLocalLabel("")
                      }
                    }}
                    onFocus={() => {
                      setEditingSpanId(span.id)
                      setLocalLabel(span.label)
                    }}
                    className="max-w-44"
                  />
                  <Button type="button" variant="outline" disabled={disabled} onClick={() => removeSpan(span.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
