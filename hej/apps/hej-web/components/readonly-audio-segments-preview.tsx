"use client"

import { Button } from "@workspace/ui/components/button"
import type { AudioSegmentAnnotation } from "@/lib/annotation-data"

type ReadonlyAudioSegmentsPreviewProps = {
  segments: AudioSegmentAnnotation[]
  className?: string
  onSeekToTime?: (seconds: number) => void
  onPlayRange?: (startSeconds: number, endSeconds: number) => void
}

function formatTime(seconds: number) {
  const totalMs = Math.max(0, Math.round(seconds * 1000))
  const hours = Math.floor(totalMs / 3_600_000)
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000)
  const secs = Math.floor((totalMs % 60_000) / 1000)
  const millis = totalMs % 1000

  const pad = (value: number) => String(value).padStart(2, "0")
  const padMs = String(millis).padStart(3, "0")

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${padMs}`
  }

  return `${pad(minutes)}:${pad(secs)}.${padMs}`
}

function formatDuration(seconds: number) {
  return formatTime(seconds)
}

export function ReadonlyAudioSegmentsPreview({
  segments,
  className,
  onSeekToTime,
  onPlayRange,
}: ReadonlyAudioSegmentsPreviewProps) {
  return (
    <div className={className ? `space-y-3 ${className}` : "space-y-3"}>
      <div className="rounded-xl border border-slate-900/10 bg-white/90 p-4 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Audio segments</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
              {segments.length} segment{segments.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      {segments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-900/10 bg-stone-50/80 px-4 py-6 text-center text-sm text-slate-600">
          No audio segments yet
        </div>
      ) : (
        <div className="space-y-3">
          {segments.map((segment) => {
            const startSeconds = Number(segment.start_seconds)
            const endSeconds = Number(segment.end_seconds)
            const duration =
              Number.isFinite(startSeconds) && Number.isFinite(endSeconds)
                ? Math.max(0, endSeconds - startSeconds)
                : 0
            const canSeekToStart =
              Boolean(onSeekToTime) && Number.isFinite(startSeconds) && startSeconds >= 0
            const canPlayRange =
              Boolean(onPlayRange) &&
              Number.isFinite(startSeconds) &&
              Number.isFinite(endSeconds) &&
              startSeconds >= 0 &&
              endSeconds > startSeconds
            return (
              <div key={segment.id} className="rounded-xl border border-slate-900/10 bg-white/90 p-4 dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatTime(startSeconds)} – {formatTime(endSeconds)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      Duration {formatDuration(duration)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canSeekToStart}
                      onClick={() => onSeekToTime?.(Math.max(0, startSeconds))}
                    >
                      Play from start
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canPlayRange}
                      onClick={() => onPlayRange?.(Math.max(0, startSeconds), endSeconds)}
                    >
                      Play range
                    </Button>
                    {segment.label ? (
                      <span className="rounded-full border border-slate-900/10 bg-stone-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {segment.label}
                      </span>
                    ) : null}
                  </div>
                </div>
                {segment.transcript ? (
                  <div className="mt-3 rounded-lg border border-slate-900/10 bg-stone-50/80 px-3 py-2 text-sm text-slate-700">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Transcript</p>
                    <p className="mt-1 whitespace-pre-wrap leading-6">{segment.transcript}</p>
                  </div>
                ) : null}
                {segment.notes ? (
                  <div className="mt-3 rounded-lg border border-slate-900/10 bg-stone-50/80 px-3 py-2 text-sm text-slate-700">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap leading-6">{segment.notes}</p>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
