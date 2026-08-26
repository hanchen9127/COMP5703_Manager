"use client"

import { ReadonlyAudioSegmentsPreview } from "@/components/readonly-audio-segments-preview"
import { ReadonlyImageBBoxPreview } from "@/components/readonly-image-bbox-preview"
import { ReadonlyTextSpansPreview } from "@/components/readonly-text-spans-preview"
import type { ImageBBox } from "@/components/image-bbox-annotator"
import {
  normalizeAnnotationRecord,
  parseAnnotationPayloadText,
  type AnnotationModality,
} from "@/lib/annotation-contract"
import { getTextSpanAnnotations, normalizeAnnotationData } from "@/lib/annotation-data"
import {
  annotationPayloadPreviewStatusLabels,
  getAnnotationPayloadPreviewStatus,
} from "@/lib/annotation-payload-preview-status"

export type AnnotationOutputKind =
  | "auto"
  | "text"
  | "json"
  | "image_bbox"
  | "audio"
  | "unknown"

export type AnnotationOutputPreviewProps = {
  title?: string
  payloadText?: string | null
  notes?: string | null
  candidateLabel?: string | null
  candidateConfidence?: string | number | null
  candidateOutput?: string | null
  emptyLabel?: string
  kind?: AnnotationOutputKind
  payloadObject?: unknown
  mediaUrl?: string | null
  alt?: string
  previewText?: string | null
  imageBoxes?: ImageBBox[]
  sourceText?: string
}


function formatPreviewPayload(payloadText?: string | null, payloadObject?: unknown): string {
  const objectToFormat = payloadObject ?? parseAnnotationPayloadText(payloadText)
  if (objectToFormat !== null) {
    return JSON.stringify(objectToFormat, null, 2)
  }
  return payloadText?.trim() ?? ""
}

function getAnnotationTypeForPreview(kind: AnnotationOutputKind): string | null {
  if (kind === "image_bbox") return "image_bbox"
  if (kind === "audio") return "audio_segments"
  return null
}

function getPreviewModality(
  kind: AnnotationOutputKind,
  normalizedModality: AnnotationModality,
  imageBoxes?: ImageBBox[],
): AnnotationModality {
  if (kind === "image_bbox") return "image"
  if (kind === "audio") return "audio"
  if (imageBoxes && imageBoxes.length > 0) return "image"
  return normalizedModality
}

function hasCandidateData(
  candidateLabel?: string | null,
  candidateConfidence?: string | number | null,
  candidateOutput?: string | null,
): boolean {
  return (
    Boolean(candidateLabel?.trim()) ||
    Boolean(candidateOutput?.trim()) ||
    (candidateConfidence !== null && candidateConfidence !== undefined)
  )
}


function NotesBlock({ notes }: { notes: string }) {
  return (
    <div className="rounded-lg border border-slate-900/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Notes</p>
      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-700 dark:text-slate-200">
        {notes}
      </p>
    </div>
  )
}

function CandidateSummaryBlock({
  candidateLabel,
  candidateConfidence,
  candidateOutput,
}: {
  candidateLabel?: string | null
  candidateConfidence?: string | number | null
  candidateOutput?: string | null
}) {
  return (
    <div className="rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Candidate summary</p>
      {candidateLabel ? (
        <p className="mt-2 text-sm font-semibold text-slate-900">{candidateLabel}</p>
      ) : null}
      {candidateConfidence !== null && candidateConfidence !== undefined ? (
        <p className="mt-1 text-xs text-slate-500">{`Confidence ${candidateConfidence}`}</p>
      ) : null}
      {candidateOutput ? (
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
          {candidateOutput}
        </p>
      ) : null}
    </div>
  )
}

export function AnnotationOutputPreview({
  title = "Submitted annotation",
  payloadText,
  notes,
  candidateLabel,
  candidateConfidence,
  candidateOutput,
  emptyLabel = "No submitted annotation available.",
  kind = "auto",
  payloadObject,
  mediaUrl,
  alt,
  previewText,
  imageBoxes,
  sourceText,
}: AnnotationOutputPreviewProps) {
  const hasNotes = typeof notes === "string" && notes.trim().length > 0
  const hasCandidate = hasCandidateData(candidateLabel, candidateConfidence, candidateOutput)
  const formattedPayload = formatPreviewPayload(payloadText, payloadObject)
  const hasPayload = formattedPayload.trim().length > 0
  const payloadStatus = getAnnotationPayloadPreviewStatus(payloadText, payloadObject)
  const payloadStatusLabel = annotationPayloadPreviewStatusLabels[payloadStatus]
  const parsedPayloadObject = payloadObject ?? parseAnnotationPayloadText(payloadText)
  const normalized = normalizeAnnotationRecord({
    payloadObject,
    payloadText,
    notes,
    annotationType: getAnnotationTypeForPreview(kind),
    mediaUrl,
  })
  const textSpans =
    kind === "text" || kind === "auto" ? getTextSpanAnnotations(parsedPayloadObject) : []
  const modality: AnnotationModality = getPreviewModality(kind, normalized.modality, imageBoxes)
  const audioAnnotationData =
    modality === "audio" && parsedPayloadObject !== null
      ? normalizeAnnotationData(parsedPayloadObject, "audio")
      : null
  const audioSegments =
    audioAnnotationData?.kind === "audio" ? audioAnnotationData.segments : []

  if (textSpans.length > 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Text spans</p>
          <div className="mt-1 text-xs font-medium text-slate-500">{payloadStatusLabel}</div>
        </div>
        <ReadonlyTextSpansPreview
          sourceText={sourceText}
          spans={textSpans}
          className="space-y-3"
        />
      </div>
    )
  }

  if (!hasPayload && !hasNotes && !hasCandidate && modality === "unknown") {
    return (
      <div className="rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
        <div className="text-xs font-medium text-slate-500">{payloadStatusLabel}</div>
        <p className="mt-2 text-sm text-slate-600">{emptyLabel}</p>
      </div>
    )
  }

  if (modality === "image") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <div className="mt-1 text-xs font-medium text-slate-500">{payloadStatusLabel}</div>
          {mediaUrl && imageBoxes && imageBoxes.length > 0 ? (
            <div className="mt-2">
              <ReadonlyImageBBoxPreview
                mediaUrl={mediaUrl}
                alt={alt ?? "image annotation"}
                boxes={imageBoxes}
                notes={notes ?? undefined}
              />
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">Image annotation preview unavailable.</p>
              {previewText?.trim() ? (
                <p className="mt-2 text-sm text-slate-600">{previewText}</p>
              ) : null}
              {hasPayload ? (
                <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white/80 p-3 text-[13px] leading-6 text-slate-800">
                  {formattedPayload}
                </pre>
              ) : null}
            </>
          )}
        </div>

        {hasNotes ? <NotesBlock notes={notes} /> : null}

        {hasCandidate ? (
          <CandidateSummaryBlock
            candidateLabel={candidateLabel}
            candidateConfidence={candidateConfidence}
            candidateOutput={candidateOutput}
          />
        ) : null}
      </div>
    )
  }

  if (modality === "audio") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Audio annotation</p>
          <div className="mt-1 text-xs font-medium text-slate-500">{payloadStatusLabel}</div>
          {previewText?.trim() ? (
            <p className="mt-2 text-sm text-slate-600">{previewText}</p>
          ) : null}
          {audioSegments.length > 0 ? (
            <ReadonlyAudioSegmentsPreview segments={audioSegments} className="mt-3" />
          ) : hasPayload ? (
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white/80 p-3 text-[13px] leading-6 text-slate-800">
              {formattedPayload}
            </pre>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No audio annotation output yet.</p>
          )}
        </div>

        {hasNotes ? <NotesBlock notes={notes} /> : null}

        {hasCandidate ? (
          <CandidateSummaryBlock
            candidateLabel={candidateLabel}
            candidateConfidence={candidateConfidence}
            candidateOutput={candidateOutput}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
        <div className="mt-1 text-xs font-medium text-slate-500">{payloadStatusLabel}</div>
        {hasPayload ? (
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white/80 p-3 text-[13px] leading-6 text-slate-800">
            {formattedPayload}
          </pre>
        ) : (
          <p className="mt-2 text-sm text-slate-600">{emptyLabel}</p>
        )}
      </div>

      {hasNotes ? <NotesBlock notes={notes} /> : null}

      {hasCandidate ? (
        <CandidateSummaryBlock
          candidateLabel={candidateLabel}
          candidateConfidence={candidateConfidence}
          candidateOutput={candidateOutput}
        />
      ) : null}
    </div>
  )
}
