"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

export type AudioSegmentDraft = {
  id: string
  start_seconds: string
  end_seconds: string
  label: string
  transcript: string
  notes: string
}

type SegmentValidation = {
  startSeconds?: string
  endSeconds?: string
}

type AudioSegmentAnnotatorProps = {
  initialSegments?: AudioSegmentDraft[]
  currentTimeSeconds?: number
  disabled?: boolean
  onSeekToTime?: (seconds: number) => void
  onPlayRange?: (startSeconds: number, endSeconds: number) => void
  onChange: (segments: AudioSegmentDraft[]) => void
}

function createSegment(index: number): AudioSegmentDraft {
  return {
    id: `segment_${index + 1}`,
    start_seconds: "",
    end_seconds: "",
    label: "",
    transcript: "",
    notes: "",
  }
}

function createNextSegment(current: AudioSegmentDraft[]): AudioSegmentDraft {
  const usedIds = new Set(current.map((segment) => segment.id))
  let nextIndex = current.length + 1
  while (usedIds.has(`segment_${nextIndex}`)) {
    nextIndex += 1
  }

  const nextSegment = createSegment(nextIndex - 1)
  const previousEndSeconds = current[current.length - 1]?.end_seconds?.trim()
  const parsedPreviousEndSeconds = previousEndSeconds ? Number(previousEndSeconds) : Number.NaN
  if (previousEndSeconds && Number.isFinite(parsedPreviousEndSeconds) && parsedPreviousEndSeconds >= 0) {
    nextSegment.start_seconds = previousEndSeconds
  }

  return nextSegment
}

function normalizeSegment(segment: Partial<AudioSegmentDraft>, fallbackId: string): AudioSegmentDraft {
  return {
    id: typeof segment.id === "string" && segment.id.trim() ? segment.id.trim() : fallbackId,
    start_seconds: typeof segment.start_seconds === "string" ? segment.start_seconds : "",
    end_seconds: typeof segment.end_seconds === "string" ? segment.end_seconds : "",
    label: typeof segment.label === "string" ? segment.label : "",
    transcript: typeof segment.transcript === "string" ? segment.transcript : "",
    notes: typeof segment.notes === "string" ? segment.notes : "",
  }
}

function normalizeTimeValue(value: string | number): string {
  const trimmed = String(value).trim()
  if (!trimmed) return trimmed

  const numeric = Number(trimmed)
  if (Number.isFinite(numeric)) {
    return String(numeric)
  }

  return trimmed
}

function segmentsEqual(left: AudioSegmentDraft[], right: AudioSegmentDraft[]) {
  if (left.length !== right.length) return false
  return left.every((segment, index) => {
    const other = right[index]
    return (
      other !== undefined &&
      segment.id === other.id &&
      normalizeTimeValue(segment.start_seconds) === normalizeTimeValue(other.start_seconds) &&
      normalizeTimeValue(segment.end_seconds) === normalizeTimeValue(other.end_seconds) &&
      segment.label === other.label &&
      segment.transcript === other.transcript &&
      segment.notes === other.notes
    )
  })
}

function parseTime(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function validateSegment(segment: AudioSegmentDraft): SegmentValidation {
  const errors: SegmentValidation = {}
  const start = parseTime(segment.start_seconds)
  const end = parseTime(segment.end_seconds)
  if (!Number.isFinite(start)) {
    errors.startSeconds = "Start time is required and must be a finite number."
  }
  if (!Number.isFinite(end)) {
    errors.endSeconds = "End time is required and must be a finite number."
  } else if (Number.isFinite(start) && end <= start) {
    errors.endSeconds = "End time must be greater than start time."
  }
  return errors
}

function formatCurrentTimeLabel(value: number | undefined): string {
  if (!Number.isFinite(value ?? Number.NaN)) return "0.00"
  return (value as number).toFixed(2)
}

function formatCurrentTimeInput(value: number | undefined): string {
  if (!Number.isFinite(value ?? Number.NaN)) return "0"
  const rounded = Math.round((value as number) * 1000) / 1000
  return String(rounded)
}

function formatSegmentDuration(startValue: string, endValue: string): string {
  const start = parseTime(startValue)
  const end = parseTime(endValue)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "—"
  if (start < 0) return "—"
  if (end <= start) return "—"
  const duration = end - start
  return `${duration.toFixed(2)}s`
}

export function AudioSegmentAnnotator({
  initialSegments,
  currentTimeSeconds,
  disabled,
  onSeekToTime,
  onPlayRange,
  onChange,
}: AudioSegmentAnnotatorProps) {
  const [segments, setSegments] = useState<AudioSegmentDraft[]>(
    initialSegments?.length ? initialSegments : [createSegment(0)],
  )
  const onChangeRef = useRef(onChange)
  const pendingEmitRef = useRef<AudioSegmentDraft[] | null>(null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    setSegments((current) => {
      if (initialSegments?.length) {
        return segmentsEqual(current, initialSegments) ? current : initialSegments
      }
      return current.length > 0 ? current : [createSegment(0)]
    })
  }, [initialSegments])

  useEffect(() => {
    const pending = pendingEmitRef.current
    if (!pending) return
    if (!segmentsEqual(pending, segments)) return

    pendingEmitRef.current = null
    onChangeRef.current(segments)
  }, [segments])

  const validations = useMemo(() => segments.map(validateSegment), [segments])

  function commitSegments(
    updater: (current: AudioSegmentDraft[]) => AudioSegmentDraft[],
  ) {
    setSegments((current) => {
      const next = updater(current)
      if (segmentsEqual(current, next)) return current
      pendingEmitRef.current = next
      return next
    })
  }

  function updateSegment(index: number, patch: Partial<AudioSegmentDraft>) {
    commitSegments((current) =>
      current.map((segment, currentIndex) =>
        currentIndex === index
          ? normalizeSegment({ ...segment, ...patch }, segment.id || `segment_${index + 1}`)
          : segment,
      ),
    )
  }

  function addSegment() {
    commitSegments((current) => [...current, createNextSegment(current)])
  }

  function deleteSegment(index: number) {
    commitSegments((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index)
      return next.length > 0 ? next : [createSegment(0)]
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-900/10 bg-white/90 p-4 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Transcript segments</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
              {segments.length} segment{segments.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSegment} disabled={disabled}>
            <Plus className="mr-1.5 size-3.5" />
            Add segment
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Current player time: {formatCurrentTimeLabel(currentTimeSeconds)}s</p>
      </div>

      <div className="space-y-3">
        {segments.map((segment, index) => {
          const validation = validations[index] ?? {}
          const startSeconds = parseTime(segment.start_seconds)
          const endSeconds = parseTime(segment.end_seconds)
          const previousSegment = index > 0 ? segments[index - 1] : undefined
          const previousEndSeconds = previousSegment ? parseTime(previousSegment.end_seconds) : Number.NaN
          const hasOverlapWarning =
            index > 0 &&
            Number.isFinite(startSeconds) &&
            Number.isFinite(previousEndSeconds) &&
            startSeconds < previousEndSeconds
          const durationLabel = formatSegmentDuration(segment.start_seconds, segment.end_seconds)
          const canSeekToStart =
            Boolean(onSeekToTime) && Number.isFinite(startSeconds) && startSeconds >= 0
          const canPlayRange =
            Number.isFinite(startSeconds) &&
            Number.isFinite(endSeconds) &&
            startSeconds >= 0 &&
            endSeconds > startSeconds &&
            Boolean(onPlayRange)
          return (
            <div key={segment.id} className="rounded-xl border border-slate-900/10 bg-white/90 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Segment {index + 1}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                    Duration {durationLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!canSeekToStart) return
                      onSeekToTime?.(Math.max(0, startSeconds))
                    }}
                    disabled={disabled || !canSeekToStart}
                  >
                    Play from start
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!canPlayRange) return
                      onPlayRange?.(Math.max(0, startSeconds), endSeconds)
                    }}
                    disabled={disabled || !canPlayRange}
                  >
                    Play range
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSegment(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Start seconds</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateSegment(index, {
                          start_seconds: formatCurrentTimeInput(currentTimeSeconds),
                        })
                      }
                      disabled={disabled}
                    >
                      Set start
                    </Button>
                  </div>
                  <Input
                    type="number"
                    step="0.001"
                    value={segment.start_seconds}
                    onChange={(event) => updateSegment(index, { start_seconds: event.target.value })}
                    disabled={disabled}
                  />
                  {validation.startSeconds ? <p className="text-xs text-red-600">{validation.startSeconds}</p> : null}
                </label>
                <label className="space-y-1.5 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">End seconds</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateSegment(index, {
                          end_seconds: formatCurrentTimeInput(currentTimeSeconds),
                        })
                      }
                      disabled={disabled}
                    >
                      Set end
                    </Button>
                  </div>
                  <Input
                    type="number"
                    step="0.001"
                    value={segment.end_seconds}
                    onChange={(event) => updateSegment(index, { end_seconds: event.target.value })}
                    disabled={disabled}
                  />
                  {validation.endSeconds ? <p className="text-xs text-red-600">{validation.endSeconds}</p> : null}
                  {hasOverlapWarning ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      This segment starts before the previous segment ends.
                    </p>
                  ) : null}
                </label>
              </div>

              <div className="mt-3 grid gap-3">
                <label className="space-y-1.5 text-sm text-slate-700">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Label</span>
                  <Input
                    value={segment.label}
                    onChange={(event) => updateSegment(index, { label: event.target.value })}
                    disabled={disabled}
                  />
                </label>
                <label className="space-y-1.5 text-sm text-slate-700">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Transcript text</span>
                  <Textarea
                    value={segment.transcript}
                    onChange={(event) => updateSegment(index, { transcript: event.target.value })}
                    disabled={disabled}
                    rows={3}
                  />
                </label>
                <label className="space-y-1.5 text-sm text-slate-700">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Notes</span>
                  <Textarea
                    value={segment.notes}
                    onChange={(event) => updateSegment(index, { notes: event.target.value })}
                    disabled={disabled}
                    rows={3}
                  />
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
