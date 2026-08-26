"use client"

import type { TextSpanAnnotation } from "@/lib/annotation-data"

function getSpanPreviewText(span: TextSpanAnnotation, sourceText?: string): string {
  if (typeof span.text === "string" && span.text.trim().length > 0) {
    return span.text
  }

  if (
    typeof sourceText === "string" &&
    span.start_offset >= 0 &&
    span.end_offset <= sourceText.length &&
    span.end_offset > span.start_offset
  ) {
    return sourceText.slice(span.start_offset, span.end_offset)
  }

  return "(unavailable)"
}

function getSpanStatus(span: TextSpanAnnotation, sourceText?: string): { highlightable: boolean; warning?: string } {
  if (typeof sourceText !== "string") {
    return { highlightable: false }
  }

  if (span.start_offset < 0 || span.end_offset > sourceText.length || span.end_offset <= span.start_offset) {
    return { highlightable: false, warning: "Out of bounds" }
  }

  return { highlightable: true }
}

function getStableSpanKey(span: TextSpanAnnotation, index: number) {
  return `${span.id || "span"}-${index}-${span.start_offset}-${span.end_offset}-${span.label || "unlabeled"}`
}

function hasDuplicateSpanIds(spans: TextSpanAnnotation[]) {
  const seen = new Set<string>()
  for (const span of spans) {
    if (!span.id) continue
    if (seen.has(span.id)) return true
    seen.add(span.id)
  }
  return false
}

function buildSegments(sourceText: string, spans: TextSpanAnnotation[]) {
  const sorted = [...spans].sort((left, right) => {
    if (left.start_offset !== right.start_offset) return left.start_offset - right.start_offset
    return left.end_offset - right.end_offset
  })

  const segments: Array<
    | { type: "text"; key: string; value: string }
    | { type: "mark"; key: string; value: string; label: string; id: string }
  > = []
  let cursor = 0

  for (const span of sorted) {
    const status = getSpanStatus(span, sourceText)
    if (!status.highlightable || span.start_offset < cursor) {
      continue
    }

    if (cursor < span.start_offset) {
      segments.push({ type: "text", key: `text-${cursor}-${span.start_offset}`, value: sourceText.slice(cursor, span.start_offset) })
    }

    const segmentIndex = segments.length
    segments.push({
      type: "mark",
      key: getStableSpanKey(span, segmentIndex),
      value: sourceText.slice(span.start_offset, span.end_offset),
      label: span.label,
      id: span.id,
    })
    cursor = span.end_offset
  }

  if (cursor < sourceText.length) {
    segments.push({ type: "text", key: `text-${cursor}-${sourceText.length}`, value: sourceText.slice(cursor) })
  }

  return segments
}

export function ReadonlyTextSpansPreview({
  sourceText,
  spans,
  className,
}: {
  sourceText?: string
  spans: TextSpanAnnotation[]
  className?: string
}) {
  const sorted = [...spans].sort((left, right) => {
    if (left.start_offset !== right.start_offset) return left.start_offset - right.start_offset
    return left.end_offset - right.end_offset
  })
  const segments = typeof sourceText === "string" ? buildSegments(sourceText, sorted) : []
  const hasDuplicateIds = hasDuplicateSpanIds(sorted)
  let lastHighlightedEnd = -1

  return (
    <div className={className ?? "space-y-3"}>
      <div className="rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Text spans</p>
        {hasDuplicateIds ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Some span ids are duplicated; display order is used to keep the preview stable.
          </p>
        ) : null}
        {typeof sourceText === "string" ? (
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-[13px] leading-6 text-slate-800 dark:bg-slate-950/40 dark:text-slate-100">
            {segments.length > 0 ? (
              segments.map((segment) => {
                if (segment.type === "text") {
                  return <span key={segment.key}>{segment.value}</span>
                }
                return (
                  <mark
                    key={segment.key}
                    className="rounded bg-amber-200/80 px-0.5 text-slate-950 dark:bg-amber-300/30 dark:text-slate-50"
                    title={segment.label}
                  >
                    {segment.value}
                  </mark>
                )
              })
            ) : (
              sourceText
            )}
          </pre>
        ) : null}

        {sorted.length === 0 ? <p className="mt-2 text-sm text-slate-600">No text spans provided.</p> : null}
      </div>

      <div className="space-y-2">
        {sorted.map((span, index) => {
          const status = getSpanStatus(span, sourceText)
          const overlapWarning =
            typeof sourceText === "string" && status.highlightable && span.start_offset < lastHighlightedEnd
              ? "Overlapping"
              : null
          if (status.highlightable && span.end_offset > lastHighlightedEnd) {
            lastHighlightedEnd = span.end_offset
          }

          return (
            <div
              key={span.id || `span_${index + 1}`}
              className="rounded-xl border border-slate-900/10 bg-white/70 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{span.label}</span>
                <span className="text-xs text-slate-500">
                  {span.start_offset}–{span.end_offset}
                </span>
                {status.warning ? <span className="text-xs text-amber-700">{status.warning}</span> : null}
                {overlapWarning ? <span className="text-xs text-amber-700">{overlapWarning}</span> : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-700 dark:text-slate-200">
                {getSpanPreviewText(span, sourceText)}
              </p>
              {typeof span.notes === "string" && span.notes.trim().length > 0 ? (
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                  Notes: {span.notes}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
