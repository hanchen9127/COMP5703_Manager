"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Bot,
  CheckCircle2,
  CircleHelp,
  FileSearch,
  FileText,
  Image as ImageIcon,
  ListTodo,
  MessageSquareQuote,
  Mic,
  PencilLine,
  Scale,
  ShieldCheck,
  Sparkles,
  Tags,
  XCircle,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import { ImageBBoxAnnotator, type ImageBBox, type ImageBBoxDraftState } from "@/components/image-bbox-annotator"
import { AnnotationOutputPreview } from "@/components/annotation-output-preview"
import { AudioSegmentAnnotator, type AudioSegmentDraft } from "@/components/audio-segment-annotator"
import { ReadonlyAudioSegmentsPreview } from "@/components/readonly-audio-segments-preview"
import { ReadonlyImageBBoxPreview } from "@/components/readonly-image-bbox-preview"
import { TextSpanAnnotator, type TextSpanDraft } from "@/components/text-span-annotator"
import {
  getTextSpanAnnotations,
  normalizeAnnotationData,
  type TextSpanAnnotation,
} from "@/lib/annotation-data"
import { parseAnnotationPayloadText } from "@/lib/annotation-contract"
import { getAnnotationPayloadPreviewStatus } from "@/lib/annotation-payload-preview-status"
import { TASK_ITEM_STATUS } from "@/lib/domain/task-status"
import {
  getDefaultTextSpanLabelOptions,
  normalizeInitialTextSpanLabelOptions,
} from "@/lib/text-span-label-options"

import {
  getTaskItemAdjustment,
  routeTaskItemEscalation,
  submitTaskItemReviewAction,
  type ReviewWireAction,
} from "@/lib/api/review-actions"
import { getTaskResolvedPolicy, type ApiResolvedPolicy } from "@/lib/api/policies"
import { hejApiBaseUrl } from "@/lib/api-config"
import { normalizeTaskItemStatus } from "@/lib/api/status-mapping"
import {
  canAnnotate,
  canReview,
  runAnnotateAction,
  type AnnotateAction,
  type AnnotateActionPayload,
  type TaskActionCompleteEvent,
  type ReviewDecision,
} from "@/lib/task-item-actions"
import {
  applyTaskItemTransition,
  formatTaskClassLabel,
  formatTaskItemStatusLabel,
  formatTaskLabel,
  getJudgementDisplayValue,
  getJudgementRationale,
  getJudgementSignalValue,
  type TaskItemTransitionAction,
} from "@/lib/task-format"
import { useTaskItemContent } from "@/hooks/use-task-item-content"
import type { ApiTaskItemContent } from "@/lib/api/task-item-content"
import type { AudioAnnotationData, AudioSegmentAnnotation, ImageAnnotationData } from "@/lib/annotation-data"
import type { MockTask, MockTaskItem } from "@/lib/domain/task-types"
import type { ActivityEvent } from "@/lib/domain/admin-types"

type WorkspaceTab = "details" | "annotate" | "review"

type SheetFeedback = { kind: "error" | "success"; message: string }

type TextSpanSelection = {
  start: number
  end: number
  text: string
}

type TextHighlightPart =
  | { kind: "text"; key: string; text: string }
  | { kind: "span"; key: string; id: string; text: string; label: string; start: number; end: number }

type TaskItemViewportPanelSharedProps = {
  mode: "annotate" | "review"
  taskType: string
  item: MockTaskItem
  mediaWorkspaceLabel: string
  content: ApiTaskItemContent | null
  loading: boolean
  error: string | null
}

type TaskItemViewportPanelTextProps = {
  onTextSpanSelectionChange?: (selection: TextSpanSelection | null) => void
  currentTextDrafts?: TextSpanDraft[]
  activeTextSpanId?: string | null
  scrollToTextSpanId?: string | null
  onTextSpanScrolled?: () => void
}

type TaskItemViewportPanelImageProps = {
  onImageBBoxDraftChange?: (itemId: string, state: ImageBBoxDraftState) => void
}

type TaskItemViewportPanelAudioProps = {
  audioSegmentDrafts?: AudioSegmentDraft[]
  audioSegmentAnnotatorDisabled?: boolean
  onAudioSegmentDraftChange?: (itemId: string, segments: AudioSegmentDraft[]) => void
}

type TaskItemViewportPanelProps = TaskItemViewportPanelSharedProps &
  TaskItemViewportPanelTextProps &
  TaskItemViewportPanelImageProps &
  TaskItemViewportPanelAudioProps

type AnnotationSignature = {
  text: string
  image: string
  audio: string
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  )
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`
}

function buildAnnotationSignatureFromItem(item: MockTaskItem): AnnotationSignature {
  const annotationData = item.draftAnnotationData
  return {
    text: stableStringify({
      payloadText: item.draftPayloadText ?? "",
      notes: item.draftNotes ?? "",
    }),
    image: stableStringify({
      boxes:
        annotationData && annotationData.kind === "image"
          ? annotationData.boxes.map((box, index) => ({
              id:
                typeof box.id === "string" && box.id.trim()
                  ? box.id.trim()
                  : `box_${index + 1}`,
              label:
                typeof box.label === "string" && box.label.trim()
                  ? box.label.trim()
                  : "object",
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
            }))
          : [],
      notes: getImageBBoxInitialNotes(item),
    }),
    audio: stableStringify({
      segments:
        annotationData && annotationData.kind === "audio"
          ? annotationData.segments.map(normalizeAudioSegmentDraft)
          : [],
    }),
  }
}

function buildCurrentAnnotationSignature(
  annotationOutput: string,
  annotationNotes: string,
  imageBBoxDraft?: ImageBBoxDraftState,
  audioSegmentDrafts?: AudioSegmentDraft[],
  textSpanDrafts?: TextSpanDraft[],
): AnnotationSignature {
  return {
    text: stableStringify({
      payloadText: annotationOutput,
      notes: annotationNotes,
      spans: (textSpanDrafts ?? []).map((span, index) => ({
        id: span.id?.trim() ? span.id.trim() : newTextSpanId(index),
        start_offset: span.start_offset,
        end_offset: span.end_offset,
        text: span.text,
        label: span.label,
        notes: span.notes ?? undefined,
      })),
    }),
    image: stableStringify({
      boxes: imageBBoxDraft?.boxes ?? [],
      notes: imageBBoxDraft?.notes ?? "",
    }),
    audio: stableStringify({
      segments: audioSegmentDrafts ?? [],
    }),
  }
}

function signatureEquals(left: AnnotationSignature, right: AnnotationSignature) {
  return left.text === right.text && left.image === right.image && left.audio === right.audio
}

const TEXT_SPAN_LABEL_TONES: { markClassName: string; badgeClassName: string; buttonClassName: string }[] = [
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
  const normalizedLabel = label.trim().toLowerCase()
  if (paletteSize <= 0) return 0

  let hash = 0
  for (let index = 0; index < normalizedLabel.length; index += 1) {
    hash = (hash * 31 + normalizedLabel.charCodeAt(index)) >>> 0
  }

  return hash % paletteSize
}

function getTextSpanLabelTone(label: string) {
  const normalizedLabel = label.trim().toLowerCase()
  const semanticToneIndex: Record<string, number> = {
    noun: 0,
    nominal: 0,
    entity: 0,
    verb: 1,
    action: 1,
    predicate: 1,
    person: 2,
    location: 5,
    organization: 3,
    org: 3,
    contradicts: 4,
    contradiction: 4,
    supports: 0,
    support: 0,
    insufficient_evidence: 8,
    insufficient: 8,
    unknown: 8,
    ambiguous: 7,
    ambiguity: 7,
    approve: 0,
    revise: 1,
    unsupported: 4,
  }
  const mappedIndex = semanticToneIndex[normalizedLabel]
  const index =
    typeof mappedIndex === "number"
      ? mappedIndex
      : getStableLabelColorIndex(normalizedLabel, TEXT_SPAN_LABEL_TONES.length)
  return TEXT_SPAN_LABEL_TONES[index] ?? TEXT_SPAN_LABEL_TONES[0]!
}

function getJudgementDisplayData(item: MockTaskItem) {
  return {
    judgementValue: getJudgementDisplayValue(item),
    judgementSignal: getJudgementSignalValue(item),
    judgementRationale: getJudgementRationale(item),
  }
}

function getWorkspaceActionLabel(isJudgement: boolean) {
  return isJudgement ? "Judge" : "Annotate"
}

type GetWorkspaceAnnotationJsonErrorArgs = {
  taskType: MockTask["taskType"]
  textAnnotationPayloadPreview: string
  audioAnnotationPayloadPreview: string
  annotationOutput: string
}

function getWorkspaceAnnotationJsonError({
  taskType,
  textAnnotationPayloadPreview,
  audioAnnotationPayloadPreview,
  annotationOutput,
}: GetWorkspaceAnnotationJsonErrorArgs) {
  return taskType === "text"
    ? getAnnotationJsonError(textAnnotationPayloadPreview)
    : taskType === "audio"
      ? getAnnotationJsonError(audioAnnotationPayloadPreview)
      : annotationOutput.trim()
        ? getAnnotationJsonError(annotationOutput)
        : null
}

type GetCurrentAnnotationSignaturePayloadTextArgs = {
  taskType: MockTask["taskType"]
  textAnnotationPayloadPreview: string
  audioAnnotationPayloadPreview: string
  annotationOutput: string
}

function getCurrentAnnotationSignaturePayloadText({
  taskType,
  textAnnotationPayloadPreview,
  audioAnnotationPayloadPreview,
  annotationOutput,
}: GetCurrentAnnotationSignaturePayloadTextArgs) {
  return taskType === "text"
    ? textAnnotationPayloadPreview
    : taskType === "audio"
      ? audioAnnotationPayloadPreview
      : annotationOutput
}

type DraftAnnotationSource = {
  draftAnnotationData?: unknown
  draftPayloadText?: string | null
} | null | undefined

function hasStructuredDraftAnnotationData(source: DraftAnnotationSource): boolean {
  const data = source?.draftAnnotationData
  return Boolean(data && typeof data === "object")
}

function hasDraftPayloadText(source: DraftAnnotationSource): boolean {
  return Boolean(source?.draftPayloadText?.trim())
}

function hasDraftSourceConflict(source: DraftAnnotationSource): boolean {
  return hasStructuredDraftAnnotationData(source) && hasDraftPayloadText(source)
}

function newTextSpanId(index: number) {
  return `span_${index + 1}`
}

function normalizeTextSpan(span: TextSpanDraft, index = 0): TextSpanDraft {
  return {
    ...span,
    id: span.id?.trim() ? span.id.trim() : newTextSpanId(index),
    label: span.label?.trim() ? span.label.trim() : "object",
    notes: span.notes?.trim() ? span.notes.trim() : undefined,
  }
}

function isAudioAnnotationData(
  value: MockTaskItem["draftAnnotationData"],
): value is AudioAnnotationData {
  return Boolean(value && typeof value === "object" && value.kind === "audio")
}

function formatAudioTimePreview(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeAudioSegmentDraft(
  segment: AudioSegmentAnnotation,
): AudioSegmentDraft {
  return {
    id: segment.id,
    start_seconds: segment.start_seconds == null ? "" : String(segment.start_seconds),
    end_seconds: segment.end_seconds == null ? "" : String(segment.end_seconds),
    label: segment.label ?? "",
    transcript: segment.transcript ?? "",
    notes: segment.notes ?? "",
  }
}

function parseAudioSegmentDraft(segment: AudioSegmentDraft): {
  ok: true
  value: {
    id: string
    start_seconds: number
    end_seconds: number
    label?: string
    transcript?: string
    notes?: string
  }
} | {
  ok: false
  error: string
} {
  const start_seconds = Number(segment.start_seconds)
  const end_seconds = Number(segment.end_seconds)
  if (!Number.isFinite(start_seconds) || !Number.isFinite(end_seconds)) {
    return { ok: false, error: "Start and end times must be finite numbers." }
  }
  if (end_seconds < start_seconds) {
    return { ok: false, error: "End time must be greater than or equal to start time." }
  }
  const label = segment.label.trim()
  const transcript = segment.transcript.trim()
  const notes = segment.notes.trim()
  return {
    ok: true,
    value: {
      id: segment.id,
      start_seconds,
      end_seconds,
      ...(label ? { label } : {}),
      ...(transcript ? { transcript } : {}),
      ...(notes ? { notes } : {}),
    },
  }
}

function getImageAnnotationDataFromPayload(item: MockTaskItem): ImageAnnotationData | null {
  const parsed = parseAnnotationPayloadText(item.draftPayloadText)
  if (!parsed) return null

  const normalized = normalizeAnnotationData(parsed, "image")
  return normalized.kind === "image" ? normalized : null
}

function imageAnnotationBoxesToDraft(boxes: ImageAnnotationData["boxes"]): ImageBBox[] {
  return boxes.map((box, index) => ({
    id: typeof box.id === "string" && box.id.trim() ? box.id.trim() : `box_${index + 1}`,
    label: typeof box.label === "string" && box.label.trim() ? box.label.trim() : "object",
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  }))
}

function getImageBBoxInitialBoxes(item: MockTaskItem): ImageBBox[] {
  const annotationData = item.draftAnnotationData
  if (annotationData && annotationData.kind === "image") {
    return imageAnnotationBoxesToDraft(annotationData.boxes)
  }

  const payloadAnnotationData = getImageAnnotationDataFromPayload(item)
  return payloadAnnotationData ? imageAnnotationBoxesToDraft(payloadAnnotationData.boxes) : []
}

function getImageBBoxInitialNotes(item: MockTaskItem): string {
  const annotationData = item.draftAnnotationData
  if (annotationData && annotationData.kind === "image") {
    const notes = annotationData.metadata?.notes
    if (typeof notes === "string" && notes.trim()) {
      return notes.trim()
    }
  }

  const payloadAnnotationData = getImageAnnotationDataFromPayload(item)
  const payloadNotes = payloadAnnotationData?.metadata?.notes
  if (typeof payloadNotes === "string" && payloadNotes.trim()) {
    return payloadNotes.trim()
  }

  return item.draftNotes ?? ""
}

function buildImageBBoxDraftPayload(
  imageUrl: string,
  boxes: ImageBBox[],
  notes: string
) {
  return {
    kind: "image_bbox",
    version: 1,
    imageUrl,
    boxes,
    notes,
  }
}

function textSpanAnnotationToDraft(span: TextSpanAnnotation, index: number): TextSpanDraft {
  return normalizeTextSpan(
    {
      id: span.id ?? newTextSpanId(index),
      start_offset: span.start_offset ?? span.start ?? 0,
      end_offset: span.end_offset ?? span.end ?? 0,
      text: span.text ?? "",
      label: span.label,
      notes: span.notes,
    },
    index,
  )
}

function getTextSpanInitialSpans(item: MockTaskItem): TextSpanDraft[] {
  const annotationData = item.draftAnnotationData

  if (annotationData && annotationData.kind === "text") {
    const annotationSpans = getTextSpanAnnotations(annotationData)
    if (annotationSpans.length > 0) {
      return annotationSpans.map(textSpanAnnotationToDraft)
    }
  }

  const payloadSpans = getTextSpanAnnotations(parseAnnotationPayloadText(item.draftPayloadText))
  return payloadSpans.map(textSpanAnnotationToDraft)
}

function buildTextHighlightParts(text: string, spans: TextSpanDraft[]): TextHighlightPart[] {
  const sortedSpans = [...spans]
    .filter((span) => span.start_offset >= 0 && span.end_offset > span.start_offset && span.end_offset <= text.length)
    .sort((a, b) => a.start_offset - b.start_offset || a.end_offset - b.end_offset)

  const parts: TextHighlightPart[] = []
  let cursor = 0
  sortedSpans.forEach((span, index) => {
    if (span.start_offset < cursor) return
    if (span.start_offset > cursor) {
      parts.push({ kind: "text", key: `text_${cursor}_${span.start_offset}`, text: text.slice(cursor, span.start_offset) })
    }
    parts.push({ kind: "span", key: span.id || `span_${index}`, id: span.id || `span_${index}`, text: text.slice(span.start_offset, span.end_offset), label: span.label, start: span.start_offset, end: span.end_offset })
    cursor = span.end_offset
  })
  if (cursor < text.length) parts.push({ kind: "text", key: `text_${cursor}_${text.length}`, text: text.slice(cursor) })
  return parts
}

function buildTextSpanDraftPayload(spans: TextSpanDraft[], notes: string) {
  return {
    kind: "text",
    version: 1,
    text_spans: spans.map((span, index) => ({
      id: span.id?.trim() ? span.id.trim() : newTextSpanId(index),
      start_offset: span.start_offset,
      end_offset: span.end_offset,
      text: span.text,
      label: span.label,
      ...(span.notes ? { notes: span.notes } : {}),
    })),
    notes,
  }
}

function getTextSpanPayloadText(spans: TextSpanDraft[], notes: string): string {
  return JSON.stringify(buildTextSpanDraftPayload(spans, notes), null, 2)
}

function getAnnotationJsonError(payloadText: string): string | null {
  if (!payloadText.trim()) return null

  try {
    JSON.parse(payloadText.trim())
    return null
  } catch (error) {
    if (error instanceof SyntaxError && error.message) {
      return error.message
    }
    return "Invalid JSON"
  }
}

function formatAnnotationJson(payloadText: string): string {
  const trimmed = payloadText.trim()
  if (!trimmed) return payloadText
  return JSON.stringify(JSON.parse(trimmed), null, 2)
}

type UseCurrentItemAnnotationDraftsArgs = {
  itemId: string | undefined
  textSpanDraftsByItemId: Record<string, TextSpanDraft[]>
  imageBBoxDraftsByItemId: Record<string, ImageBBoxDraftState>
  audioSegmentDraftsByItemId: Record<string, AudioSegmentDraft[]>
}

function useCurrentItemAnnotationDrafts({
  itemId,
  textSpanDraftsByItemId,
  imageBBoxDraftsByItemId,
  audioSegmentDraftsByItemId,
}: UseCurrentItemAnnotationDraftsArgs) {
  return {
    currentTextDrafts: itemId ? textSpanDraftsByItemId[itemId] : undefined,
    currentImageDraft: itemId ? imageBBoxDraftsByItemId[itemId] : undefined,
    currentAudioDrafts: itemId ? audioSegmentDraftsByItemId[itemId] : undefined,
  }
}

function mergeSelectedSpanIntoAnnotationJson(
  payloadText: string,
  selection: TextSpanSelection
): string {
  let nextPayload: Record<string, unknown> = {}

  try {
    const parsed = JSON.parse(payloadText.trim())
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      nextPayload = { ...(parsed as Record<string, unknown>) }
    }
  } catch {
    nextPayload = {}
  }

  nextPayload.span_start = selection.start
  nextPayload.span_end = selection.end
  nextPayload.selected_text = selection.text

  return JSON.stringify(nextPayload, null, 2)
}

const SUCCESS_COPY: Record<TaskItemTransitionAction, string> = {
  save_draft: "Saved as draft.",
  submit_annotation: "Submitted for review.",
  submit_judgement: "Submitted for review.",
  accept_review: "Accepted.",
  revise_review: "Sent back for revision.",
  adjust_review: "Returned for adjustment.",
  reject_review: "Rejected.",
  escalate_review: "Escalated to dispute.",
}

const REVIEW_TRANSITION_TO_WIRE: Record<
  TaskItemTransitionAction,
  ReviewWireAction | null
> = {
  save_draft: null,
  submit_annotation: null,
  submit_judgement: null,
  accept_review: "accept",
  revise_review: "revise",
  adjust_review: "adjust",
  reject_review: "reject",
  escalate_review: "escalate",
}

type TaskItemWorkspaceSheetProps = {
  task: MockTask
  item: MockTaskItem | null
  activity: ActivityEvent[]
  open: boolean
  initialTab: WorkspaceTab
  onOpenChange: (open: boolean) => void
  onItemUpdated?: (item: MockTaskItem) => void
  onActionComplete?: (event: TaskActionCompleteEvent) => void
}

export function TaskItemWorkspaceSheet({
  task,
  item,
  activity,
  open,
  initialTab,
  onOpenChange,
  onItemUpdated,
  onActionComplete,
}: TaskItemWorkspaceSheetProps) {
  const isJudgement = task.taskClass === "judgement"
  const isAiAssisted = task.executionMode === "ai_assisted"

  const defaultTextSpanLabelOptions = getDefaultTextSpanLabelOptions(task.taskClass)

  const textSpanLabelOptions =
    normalizeInitialTextSpanLabelOptions(task.textSpanLabelOptions) ??
    defaultTextSpanLabelOptions

  const [feedback, setFeedback] = useState<SheetFeedback | null>(null)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab)
  const [resolvedReviewPolicy, setResolvedReviewPolicy] = useState<ApiResolvedPolicy | null>(null)
  const [verdict, setVerdict] = useState("")
  const [rationale, setRationale] = useState("")
  const [annotationOutput, setAnnotationOutput] = useState("")
  const [annotationNotes, setAnnotationNotes] = useState("")
  const [textSpanDraftsByItemId, setTextSpanDraftsByItemId] = useState<
    Record<string, TextSpanDraft[]>
  >({})
  const [imageBBoxDraftsByItemId, setImageBBoxDraftsByItemId] = useState<
    Record<string, ImageBBoxDraftState>
  >({})
  const [audioSegmentDraftsByItemId, setAudioSegmentDraftsByItemId] = useState<
    Record<string, AudioSegmentDraft[]>
  >({})
  const [pendingAnnotateAction, setPendingAnnotateAction] = useState<AnnotateAction | null>(null)
  const [pendingReviewAction, setPendingReviewAction] = useState<TaskItemTransitionAction | null>(null)
  const [adjustmentNote, setAdjustmentNote] = useState<string | null>(null)
  const [reviewVerdict, setReviewVerdict] = useState("")
  const [reviewPayload, setReviewPayload] = useState("")
  const [reviewNote, setReviewNote] = useState("")
  const [textSpanSelection, setTextSpanSelection] = useState<TextSpanSelection | null>(null)
  const [activeTextSpanId, setActiveTextSpanId] = useState<string | null>(null)
  const [scrollToTextSpanId, setScrollToTextSpanId] = useState<string | null>(null)
  const [annotationBaselineSignature, setAnnotationBaselineSignature] =
    useState<AnnotationSignature | null>(null)
  const workspaceKind = getWorkspaceKind({
    taskType: task.taskType,
    annotationType: task.outputSchemaRef,
    outputSchemaRef: task.outputSchemaRef,
  })
  const isTextSpanWorkspace = workspaceKind === "text_span"
  const isImageRegionWorkspace = workspaceKind === "image_region"
  const isAudioTranscriptionWorkspace = workspaceKind === "audio_transcription"
  const isGenericJsonWorkspace = workspaceKind === "generic_json"

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab, item?.id, open])

  useEffect(() => {
    if (!item) return
    setFeedback(null)
    setVerdict(getJudgementDisplayValue(item))
    setRationale(getJudgementRationale(item))
    setAnnotationOutput(item.draftPayloadText ?? "")
    setAnnotationNotes(item.draftNotes ?? "")
    setReviewVerdict(item.canonicalVerdict ?? item.reviewDecision ?? getJudgementDisplayValue(item))
    setReviewPayload(buildReviewFinalPayload(item))
    setReviewNote(item.reviewNote ?? "")
    setTextSpanSelection(null)
    setActiveTextSpanId(null)
    setScrollToTextSpanId(null)
    setAnnotationBaselineSignature(buildAnnotationSignatureFromItem(item))
    setTextSpanDraftsByItemId((current) => {
      if (!isTextSpanWorkspace) return current
      return {
        ...current,
        [item.id]: getTextSpanInitialSpans(item),
      }
    })
    setAudioSegmentDraftsByItemId((current) => {
      if (!item) return current
      const persistedAudioSegments =
        isAudioAnnotationData(item.draftAnnotationData) && item.draftAnnotationData.segments.length > 0
          ? item.draftAnnotationData.segments.map(normalizeAudioSegmentDraft)
          : item.draftPayloadText
            ? extractAudioSegmentsFromPayload(item.draftPayloadText)
            : []
      const nextSegments =
        persistedAudioSegments.length > 0 ? persistedAudioSegments : [createEmptyAudioSegmentDraft()]
      const previous = current[item.id] ?? []
      if (stableStringify(previous) === stableStringify(nextSegments)) {
        return current
      }
      return {
        ...current,
        [item.id]: nextSegments,
      }
    })
  }, [item?.id, isTextSpanWorkspace])

  const { currentTextDrafts, currentImageDraft, currentAudioDrafts } =
    useCurrentItemAnnotationDrafts({
      itemId: item?.id,
      textSpanDraftsByItemId,
      imageBBoxDraftsByItemId,
      audioSegmentDraftsByItemId,
    })
  const textAnnotationPayloadPreview = useMemo(() => {
    return getTextSpanPayloadText(currentTextDrafts ?? [], annotationNotes)
  }, [annotationNotes, currentTextDrafts])
  const handleTextSpanScrolled = useCallback(() => {
    setScrollToTextSpanId(null)
  }, [])
  const audioAnnotationMediaUrl = useMemo(() => {
    const annotationDataAudioUrl =
      item?.draftAnnotationData &&
      typeof item.draftAnnotationData === "object" &&
      "audioUrl" in item.draftAnnotationData &&
      typeof item.draftAnnotationData.audioUrl === "string"
        ? item.draftAnnotationData.audioUrl.trim()
        : null

    return annotationDataAudioUrl || extractAudioUrlFromPayload(item?.draftPayloadText)
  }, [item?.draftAnnotationData, item?.draftPayloadText])

  const audioAnnotationPayloadPreview = useMemo(() => {
    return JSON.stringify(
      {
        kind: "audio",
        version: 1,
        ...(audioAnnotationMediaUrl ? { audioUrl: audioAnnotationMediaUrl } : {}),
        segments: (currentAudioDrafts ?? []).map((segment) => ({
          id: segment.id,
          start_seconds: formatAudioTimePreview(segment.start_seconds),
          end_seconds: formatAudioTimePreview(segment.end_seconds),
          transcript: segment.transcript.trim(),
          ...(segment.label.trim() ? { label: segment.label.trim() } : {}),
          ...(segment.notes.trim() ? { notes: segment.notes.trim() } : {}),
        })),
        notes: annotationNotes,
      },
      null,
      2,
    )
  }, [annotationNotes, audioAnnotationMediaUrl, currentAudioDrafts])
  const annotationJsonError = getWorkspaceAnnotationJsonError({
    taskType: task.taskType,
    textAnnotationPayloadPreview,
    audioAnnotationPayloadPreview,
    annotationOutput,
  })
  const draftAnnotationData = item?.draftAnnotationData
  const draftPayloadText = item?.draftPayloadText
  const draftSource = useMemo(
    () => ({ draftAnnotationData, draftPayloadText }),
    [draftAnnotationData, draftPayloadText],
  )
  const hasAnnotationDraftSourceConflict = useMemo(
    () => hasDraftSourceConflict(draftSource),
    [draftSource],
  )
  const hasInvalidRawDraftPayload = useMemo(() => {
    if (!hasDraftPayloadText(draftSource)) return false
    if (hasStructuredDraftAnnotationData(draftSource)) return false

    return getAnnotationPayloadPreviewStatus(draftPayloadText) === "invalid_json"
  }, [draftPayloadText, draftSource])
  const reviewPayloadText =
    item?.draftPayloadText && item.draftPayloadText.trim()
      ? item.draftPayloadText
      : item?.candidateOutput ?? item?.aiLabel
  const hasInvalidReviewPayload = useMemo(
    () => getAnnotationPayloadPreviewStatus(reviewPayloadText) === "invalid_json",
    [reviewPayloadText],
  )

  useEffect(() => {
    if (!open || !task?.id) {
      setResolvedReviewPolicy(null)
      return
    }

    let cancelled = false
    setResolvedReviewPolicy(null)
    void (async () => {
      const result = await getTaskResolvedPolicy(task.id)
      if (cancelled) return
      if (!result.ok) {
        return
      }
      setResolvedReviewPolicy(result.data)
    })()

    return () => {
      cancelled = true
    }
  }, [open, task.id])

  const currentAnnotationSignature = useMemo(() => {
    return buildCurrentAnnotationSignature(
      getCurrentAnnotationSignaturePayloadText({
        taskType: task.taskType,
        textAnnotationPayloadPreview,
        audioAnnotationPayloadPreview,
        annotationOutput,
      }),
      annotationNotes,
      currentImageDraft,
      currentAudioDrafts,
      currentTextDrafts,
    )
  }, [annotationNotes, annotationOutput, audioAnnotationPayloadPreview, currentAudioDrafts, currentImageDraft, currentTextDrafts, task.taskType, textAnnotationPayloadPreview])
  const hasUnsavedChanges =
    Boolean(item) &&
    annotationBaselineSignature !== null &&
    !signatureEquals(annotationBaselineSignature, currentAnnotationSignature)

  useEffect(() => {
    if (!hasUnsavedChanges) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    setAdjustmentNote(null)
    if (!item) return
    const itemStatus = normalizeTaskItemStatus(item.status)
    if (
      itemStatus !== "in_progress" &&
      itemStatus !== "returned" &&
      itemStatus !== "rejected" &&
      itemStatus !== "submitted" &&
      itemStatus !== "disputed"
    )
      return
    let cancelled = false
    void (async () => {
      const result = await getTaskItemAdjustment(task.id, item.id)
      if (cancelled) return
      if (!result.ok) return
      setAdjustmentNote(result.data.reviewer_note)
    })()
    return () => {
      cancelled = true
    }
  }, [task.id, item?.id, item?.status])

  const mediaWorkspaceLabel = getMediaWorkspaceLabel(task.taskType)
  const { judgementValue, judgementSignal, judgementRationale } = item
    ? getJudgementDisplayData(item)
    : {
        judgementValue: "",
        judgementSignal: "",
        judgementRationale: "",
      }
  const workLabel = getWorkspaceActionLabel(isJudgement)
  const resolveContentEnabled =
    open && Boolean(item?.id) && (activeTab === "annotate" || activeTab === "review")
  const {
    content: resolvedContent,
    loading: resolvedContentLoading,
    error: resolvedContentError,
  } = useTaskItemContent({
    taskId: task.id,
    taskItemId: item?.id ?? "",
    locationRef: item?.locationRef ?? null,
    enabled: resolveContentEnabled,
  })
  const isPreferenceJudgement = task.taskSubtype === "preference_judgement"

  if (!item) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden">
          <SheetHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle>Work panel</SheetTitle>
                <SheetDescription>
                  Select a task item from the table to view details, annotate, or review.
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  className="rounded-md border border-slate-900/10 px-2 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
                >
                  Close
                </button>
              </SheetClose>
            </div>
          </SheetHeader>
          <SheetBody>
            <div className="hej-surface-soft rounded-xl border border-dashed border-slate-900/15 bg-stone-50/80 p-8 text-center dark:border-white/10">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                No item selected
              </p>
              <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-400">
                Select an item from the list to open the work panel. If the table is empty, adjust
                filters or add task items first.
              </p>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>
    )
  }
  const judgementStages = [
    {
      label: "Candidate output",
      value: item.candidateOutput,
      note: item.candidateConfidence ? `Confidence ${item.candidateConfidence}` : undefined,
    },
    {
      label: "Draft verdict",
      value: item.draftVerdict,
      note: item.draftRationale,
    },
    {
      label: "Review decision",
      value: item.reviewDecision,
      note: item.reviewNote,
    },
    {
      label: "Canonical verdict",
      value: item.canonicalVerdict,
      note: item.canonicalRationale,
    },
  ].filter((stage) => stage.value || stage.note)

  const normalizedStatus = normalizeTaskItemStatus(item.status)
  const annotateDisabled = !canAnnotate(normalizedStatus)
  const reviewDisabled = !canReview(normalizedStatus)
  const annotateActionPending = pendingAnnotateAction !== null
  const reviewActionPending = pendingReviewAction !== null

  function completeAction(
    action: TaskItemTransitionAction,
    nextItem?: MockTaskItem,
    options?: { successMessage?: string; dismissAfterMs?: number },
  ) {
    if (!item) return
    const updatedItem = applyTaskItemTransition(nextItem ?? item, action)
    // Navigation/refresh side-effects should run before optimistic list updates,
    // otherwise intermediate status changes can cause the sheet/table to re-select
    // the wrong item during the same transition.
    onActionComplete?.({
      taskId: task.id,
      itemId: item.id,
      transitionAction: action,
    })
    onItemUpdated?.(updatedItem)
    setFeedback({
      kind: "success",
      message: options?.successMessage ?? SUCCESS_COPY[action],
    })
    window.setTimeout(() => {
      setFeedback(null)
      onOpenChange(false)
    }, options?.dismissAfterMs ?? 900)
  }

  async function handleAnnotateAction(action: AnnotateAction) {
    if (!item) return
    if (pendingAnnotateAction) return
    const imageBBoxMediaUrl =
      task.taskType === "image" &&
      resolvedContent?.content_kind === "image" &&
      resolvedContent.media_url
        ? resolvedContent.media_url
        : null
    const isImageAnnotateItem = Boolean(imageBBoxMediaUrl)
    const imageBBoxDraft = imageBBoxDraftsByItemId[item.id]
    const imageBBoxState = isImageAnnotateItem
      ? imageBBoxDraft ?? {
          boxes: getImageBBoxInitialBoxes(item),
          notes: getImageBBoxInitialNotes(item),
        }
      : null
    const imageBBoxPayloadText =
      imageBBoxState && imageBBoxMediaUrl
        ? JSON.stringify(
            buildImageBBoxDraftPayload(
              imageBBoxMediaUrl,
              imageBBoxState.boxes,
              imageBBoxState.notes
            )
          )
        : ""
    const imageBBoxNotes = imageBBoxState?.notes ?? ""
    const audioSegmentDrafts = audioSegmentDraftsByItemId[item.id] ?? []
    const isAudioAnnotateItem =
      task.taskType === "audio" && resolvedContent?.content_kind === "audio"
    const parsedAudioSegments = isAudioAnnotateItem
      ? audioSegmentDrafts.map(parseAudioSegmentDraft)
      : []
    if (isAudioAnnotateItem) {
      const invalidSegment = parsedAudioSegments.find((segment) => !segment.ok)
      if (invalidSegment) {
        setFeedback({ kind: "error", message: invalidSegment.error })
        return
      }
    }
    if (action === "submit") {
      if (isJudgement) {
        if (!verdict.trim()) {
          setFeedback({ kind: "error", message: "Verdict is required before submitting." })
          return
        }
        if (!rationale.trim()) {
          setFeedback({ kind: "error", message: "Rationale is required before submitting." })
          return
        }
      } else if (task.taskType === "text") {
        if (!textAnnotationPayloadPreview.trim()) {
          setFeedback({ kind: "error", message: "Annotation output is required before submitting." })
          return
        }
        try {
          JSON.parse(textAnnotationPayloadPreview.trim())
        } catch {
          setFeedback({ kind: "error", message: "Annotation output must be valid JSON." })
          return
        }
      } else if (task.taskType === "audio") {
        const invalidAudioSegment = parsedAudioSegments.find((segment) => !segment.ok)
        if (invalidAudioSegment) {
          setFeedback({ kind: "error", message: invalidAudioSegment.error })
          return
        }
        const missingTranscript = parsedAudioSegments.find(
          (segment): segment is Extract<(typeof segment), { ok: true }> =>
            segment.ok && !segment.value.transcript?.trim(),
        )
        if (missingTranscript) {
          setFeedback({ kind: "error", message: "Transcript text is required before submitting." })
          return
        }
        if (parsedAudioSegments.length === 0) {
          setFeedback({ kind: "error", message: "At least one audio segment is required before submitting." })
          return
        }
      } else if (!isImageAnnotateItem) {
        if (!annotationOutput.trim()) {
          setFeedback({ kind: "error", message: "Annotation output is required before submitting." })
          return
        }
        try {
          JSON.parse(annotationOutput.trim())
        } catch {
          setFeedback({ kind: "error", message: "Annotation output must be valid JSON." })
          return
        }
      }
    }
    const payload: AnnotateActionPayload = {
      taskId: task.id,
      itemId: item.id,
      action,
      itemStatus: item.status,
      result: isJudgement
        ? { verdict, rationale }
        : isImageAnnotateItem
          ? { payloadText: imageBBoxPayloadText, notes: imageBBoxNotes }
          : task.taskType === "text"
            ? {
                payloadText: textAnnotationPayloadPreview,
                notes: annotationNotes,
              }
            : isAudioAnnotateItem
              ? {
                  payloadText: audioAnnotationPayloadPreview,
                  notes: annotationNotes,
                }
              : { payloadText: annotationOutput, notes: annotationNotes },
    }
    const transitionAction =
      action === "save_draft"
        ? "save_draft"
        : isJudgement
          ? "submit_judgement"
          : "submit_annotation"

    setPendingAnnotateAction(action)
    setFeedback(null)
    const result = await runAnnotateAction(payload)
    setPendingAnnotateAction(null)

    if (!result.ok) {
      setPendingReviewAction(null)
      setFeedback({ kind: "error", message: result.error.message })
      return
    }

    const nextItem: MockTaskItem = {
      ...item,
      ...(isJudgement
        ? { draftVerdict: verdict, draftRationale: rationale }
        : isImageAnnotateItem
          ? {
              draftPayloadText: imageBBoxPayloadText,
              draftNotes: imageBBoxNotes,
              draftAnnotationData: {
                kind: "image",
                boxes: (imageBBoxState?.boxes ?? []).map((box, index) => ({
                  id: box.id?.trim() ? box.id.trim() : `box_${index + 1}`,
                  label: box.label?.trim() ? box.label.trim() : "object",
                  x: box.x,
                  y: box.y,
                  width: box.width,
                  height: box.height,
                })),
              },
            }
          : task.taskType === "text"
            ? {
                draftPayloadText: textAnnotationPayloadPreview,
                draftNotes: annotationNotes,
                draftAnnotationData: {
                  kind: "text",
                  spans: (currentTextDrafts ?? []).map((span, index) => ({
                    id: span.id?.trim() ? span.id.trim() : newTextSpanId(index),
                    start_offset: span.start_offset,
                    end_offset: span.end_offset,
                    text: span.text,
                    label: span.label,
                    ...(span.notes ? { notes: span.notes } : {}),
                  })),
                },
              }
          : isAudioAnnotateItem
            ? {
                draftPayloadText: audioAnnotationPayloadPreview,
                draftNotes: annotationNotes,
                draftAnnotationData: {
                  kind: "audio",
                  ...(audioAnnotationMediaUrl ? { audioUrl: audioAnnotationMediaUrl } : {}),
                  segments: parsedAudioSegments
                    .filter((segment): segment is Extract<(typeof segment), { ok: true }> => segment.ok)
                    .map((segment) => ({
                      id: segment.value.id,
                      start_seconds: segment.value.start_seconds,
                      end_seconds: segment.value.end_seconds,
                      ...(segment.value.label ? { label: segment.value.label } : {}),
                      ...(segment.value.transcript ? { transcript: segment.value.transcript } : {}),
                      ...(segment.value.notes ? { notes: segment.value.notes } : {}),
                    })),
                },
              }
            : { draftPayloadText: annotationOutput, draftNotes: annotationNotes }),
    }

    setAnnotationBaselineSignature(currentAnnotationSignature)
    setPendingReviewAction(null)

    if (action === "save_draft") {
      const updatedItem = applyTaskItemTransition(nextItem, "save_draft")
      onItemUpdated?.(updatedItem)
      setFeedback({ kind: "success", message: "Draft saved." })
      return
    }

    completeAction(transitionAction, nextItem)
  }

  async function handleReviewAction(
    decision: ReviewDecision,
    action: TaskItemTransitionAction,
  ) {
    if (!item) return
    if (reviewActionPending) return
    const wire = REVIEW_TRANSITION_TO_WIRE[action]
    if (!wire) {
      setFeedback({ kind: "error", message: "Unsupported review action." })
      return
    }
    setPendingReviewAction(action)
    setFeedback(null)

    try {
      const result = await submitTaskItemReviewAction(task.id, item.id, {
        action: wire,
        comment: reviewNote.trim() || null,
        final_payload: isJudgement ? null : reviewPayload.trim() || null,
        final_verdict: isJudgement ? reviewVerdict.trim() || null : null,
      })
      if (!result.ok) {
        setFeedback({ kind: "error", message: result.error.message })
        return
      }
      const pendingSecondReview =
        wire === "accept" &&
        result.data.review_mode === "dual_signoff" &&
        result.data.next_ui_status === "pending_second_review"

      if (pendingSecondReview) {
        const received = result.data.approvals_received ?? 1
        const required = result.data.approvals_required ?? 2
        setFeedback({
          kind: "success",
          message: `First sign-off recorded (${received}/${required}). A different reviewer must approve before this item is fully reviewed.`,
        })
        onItemUpdated?.(item)
        return
      }
      if (wire === "escalate") {
        const routed = await routeTaskItemEscalation(task.id, item.id, {
          target: "secondary_reviewer",
          assignee_ref: null,
          note: reviewNote.trim() || null,
        })
        if (!routed.ok) {
          setFeedback({
            kind: "error",
            message: `Review saved but escalation routing failed: ${routed.error.message}`,
          })
          return
        }
      }
      const nextItem: MockTaskItem = {
        ...item,
        reviewDecision: decision,
        reviewNote: reviewNote.trim() || undefined,
        ...(isJudgement && action === "accept_review" && reviewVerdict.trim()
          ? { canonicalVerdict: reviewVerdict.trim() }
          : {}),
      }

      const dualSignoffComplete =
        wire === "accept" &&
        result.data.review_mode === "dual_signoff" &&
        result.data.next_ui_status === "approved"

      if (dualSignoffComplete) {
        const received = result.data.approvals_received ?? 2
        const required = result.data.approvals_required ?? 2
        completeAction(action, nextItem, {
          successMessage: `Dual sign-off complete (${received}/${required}). This item is fully reviewed and approved.`,
          dismissAfterMs: 2200,
        })
        return
      }

      completeAction(action, nextItem)
    } finally {
      setPendingReviewAction(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[calc(100vw-2rem)] max-w-none">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle>Work panel</SheetTitle>
              <SheetDescription>
                Open the selected item, complete first-pass work, and move it into review from one place.
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <button
                type="button"
                className="rounded-md border border-slate-900/10 px-2 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
              >
                Close
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        <SheetBody className="flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden">
          {feedback ? (
            <div
              role="alert"
              className={
                feedback.kind === "error"
                  ? "rounded-lg border border-red-200 bg-red-50/95 px-3 py-2.5 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100"
                  : "rounded-lg border border-emerald-200 bg-emerald-50/95 px-3 py-2.5 text-sm text-emerald-950 dark:border-emerald-800/40 dark:bg-emerald-950/35 dark:text-emerald-100"
              }
            >
              {feedback.message}
            </div>
          ) : null}
          <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{item.externalRef}</Badge>
              <Badge variant="outline">{formatTaskClassLabel(task.taskClass)}</Badge>
              <Badge variant="outline">{formatTaskLabel(task.taskType)}</Badge>
              <Badge className="bg-slate-950 text-stone-100">
                {isAiAssisted ? "AI-assisted" : "Human-first"}
              </Badge>
              <Badge variant="outline">{formatTaskItemStatusLabel(item.status)}</Badge>
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-700">{item.preview}</p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkspaceTab)}>
            <TabsList>
              <TabsTrigger value="details">
                <ListTodo className="size-3.5" />
                Item details
              </TabsTrigger>
              <TabsTrigger value="annotate">
                <PencilLine className="size-3.5" />
                {workLabel}
              </TabsTrigger>
              <TabsTrigger value="review">
                <Scale className="size-3.5" />
                Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-3">
                <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Item summary
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-900/10 p-3.5">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Current status
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatTaskItemStatusLabel(item.status)}
                      </p>
                      {item.apiOriginalStatus ? (
                        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                          API status: {item.apiOriginalStatus} (mapped to{" "}
                          {formatTaskItemStatusLabel(TASK_ITEM_STATUS.UNSTARTED)} / Draft)
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-xl border border-slate-900/10 p-3.5">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Latest output
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {item.status === "approved"
                          ? item.canonicalVerdict ?? item.reviewDecision ?? item.aiLabel
                          : isJudgement
                            ? judgementValue
                            : item.aiLabel}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.status === "approved"
                          ? item.judgementSignal ?? item.confidence
                          : isJudgement
                            ? judgementSignal
                            : item.confidence}
                      </p>
                    </div>
                  </div>
                </div>
                {isJudgement ? (
                  <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <MessageSquareQuote className="size-4 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-900">
                        Judgement lineage
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {judgementStages.map((stage) => (
                        <div
                          key={stage.label}
                          className="rounded-xl border border-slate-900/10 p-3.5"
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {stage.label}
                          </p>
                          {stage.value ? (
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {stage.value}
                            </p>
                          ) : null}
                          {stage.note ? (
                            <p className="mt-2 text-[13px] leading-5 text-slate-600">
                              {stage.note}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {isPreferenceJudgement && item.responseA && item.responseB ? (
                  <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Scale className="size-4 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-900">
                        Preference pair
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-slate-900/10 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Response A
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-slate-700">
                          {item.responseA}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-900/10 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Response B
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-slate-700">
                          {item.responseB}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-900/10 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Preferred option
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {item.preferredOption ? `Response ${item.preferredOption}` : "Not set"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-900/10 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Preference rationale
                        </p>
                        <p className="mt-2 text-[13px] leading-5 text-slate-600">
                          {(item.preferenceRationale ?? judgementRationale) ||
                            "No rationale recorded yet."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {isJudgement && item.flags?.length ? (
                  <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Tags className="size-4 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-900">Judgement flags</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.flags.map((flag) => (
                        <Badge key={flag} variant="outline">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Execution posture
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {isAiAssisted
                      ? isJudgement
                        ? "AI candidate judgement generation is active."
                        : "AI candidate annotation generation is active."
                      : isJudgement
                        ? "Humans create first-pass judgements item by item."
                        : "Humans create first-pass annotations item by item."}
                  </p>
                  <p className="mt-3 text-[13px] leading-5 text-slate-600">
                    {task.annotationRules}
                  </p>
                </div>
                <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Recent execution events
                  </p>
                  <div className="mt-3 space-y-2">
                    {activity.slice(0, 3).map((event, idx) => (
                      <div key={`${idx}-${event.time}-${event.action}-sheet-details`} className="text-sm">
                        <p className="font-medium text-slate-900">{event.action}</p>
                        <p className="text-[13px] leading-5 text-slate-600">{event.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hej-surface-soft rounded-xl border border-dashed border-slate-900/15 bg-stone-50/60 p-4 dark:border-white/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Dispute
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
                    {item.status === "disputed"
                      ? "This item has been escalated to dispute. Resolution details will appear here once the dispute process is implemented."
                      : "No dispute raised. If review cannot resolve disagreement, it can be escalated from the Review tab."}
                  </p>
                </div>
                <div className="hej-surface-soft rounded-xl border border-dashed border-slate-900/15 bg-stone-50/60 p-4 dark:border-white/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Final decision
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
                    {item.status === "approved"
                      ? "This item has been approved. The canonical result is final."
                      : "Final decision will be recorded here after the review or dispute process completes."}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="annotate" className="min-h-0 flex-1 overflow-y-auto pr-1">
              {hasAnnotationDraftSourceConflict ? (
                <div
                  className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                  role="status"
                >
                  <p className="font-medium">Using structured draft data</p>
                  <p className="mt-1 text-xs text-amber-800">
                    This item has both structured draft data and raw payload text. The workspace is using structured draft data as the source of truth.
                  </p>
                </div>
              ) : null}
              {hasInvalidRawDraftPayload ? (
                <div
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
                  role="alert"
                >
                  <p className="font-medium">Draft payload could not be parsed</p>
                  <p className="mt-1 text-xs text-red-800">
                    The raw draft payload is invalid JSON, so the annotation workspace started from an empty/default annotation state.
                  </p>
                </div>
              ) : null}
              {adjustmentNote ? (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Reviewer feedback
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-amber-950 dark:text-amber-100">
                    {adjustmentNote}
                  </p>
                </div>
              ) : null}
              {annotateDisabled && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    This item cannot be annotated right now.
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-400">
                    Current status: {formatTaskItemStatusLabel(item.status)}.
                    {item.status === "submitted" && " It has been submitted and is awaiting review."}
                    {item.status === "approved" && " It has been approved. View details instead."}
                    {item.status === "disputed" && " It is currently under dispute."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.status === "submitted" ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => setActiveTab("review")}>
                        Go to Review
                      </Button>
                    ) : null}
                    {item.status === "approved" || item.status === "disputed" ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => setActiveTab("details")}>
                        Go to Item details
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
              {isJudgement ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Source material</p>
                      </div>
                      <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          External reference
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {item.externalRef}
                        </p>
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-900/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Primary evidence
                        </p>
                        <p className="mt-3 text-[13px] leading-6 text-slate-700">{item.preview}</p>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <CircleHelp className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Task question</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {task.judgmentQuestion}
                      </p>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">
                          Shared judgement instructions
                        </p>
                      </div>
                      <p className="mt-3 text-[13px] leading-6 text-slate-700">
                        {task.annotationRules}
                      </p>
                    </div>

                    {isAiAssisted ? (
                      <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <Bot className="size-4 text-slate-600" />
                          <p className="text-sm font-semibold text-slate-900">
                            Candidate verdict
                          </p>
                        </div>
                        <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.candidateOutput ?? item.aiLabel}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{`Confidence ${judgementSignal}`}</p>
                          {item.candidateRationale ? (
                            <p className="mt-3 text-[13px] leading-5 text-slate-600">
                              {item.candidateRationale}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <MessageSquareQuote className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Response schema</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Produce the first-pass judgement that will move into governed review.
                      </p>

                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Quick verdicts
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {defaultTextSpanLabelOptions.map((label) => {
                            const tone = getTextSpanLabelTone(label)
                            return (
                              <button
                                key={label}
                                type="button"
                                className={`hej-surface-soft rounded-full border px-3 py-1.5 text-sm transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] ${tone.buttonClassName}`}
                                onClick={() => setVerdict(label)}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Verdict</label>
                          <Input value={verdict} onChange={(e) => setVerdict(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Rationale</label>
                          <Textarea
                            value={rationale}
                            onChange={(e) => setRationale(e.target.value)}
                            placeholder="Write a short rationale explaining the verdict clearly enough for downstream review."
                            className="min-h-36"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Tags className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Operator checks</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          "The decision is grounded in the visible evidence.",
                          "The rationale is short enough for review, but specific enough to audit.",
                          "Ambiguity is preserved instead of silently guessed away.",
                        ].map((line) => (
                          <div
                            key={line}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-4 text-slate-600" />
                          <p className="text-sm font-semibold text-slate-900">Actions</p>
                        </div>
                        {hasUnsavedChanges ? (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                            Unsaved changes
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Save draft keeps the item in Draft status for later editing. Submit moves it to Submitted and sends it for review.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          className="bg-slate-900 text-stone-100"
                          disabled={annotateDisabled || annotateActionPending}
                          onClick={() => void handleAnnotateAction("save_draft")}
                        >
                          <CheckCircle2 />
                          {pendingAnnotateAction === "save_draft" ? "Saving..." : "Save draft"}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={annotateDisabled || annotateActionPending}
                          onClick={() => void handleAnnotateAction("submit")}
                        >
                          {pendingAnnotateAction === "submit" ? "Submitting..." : "Submit judgement"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(280px,0.82fr)]">
                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {renderMediaIcon(task.taskType)}
                          <p className="text-sm font-semibold text-slate-900">
                            {mediaWorkspaceLabel}
                          </p>
                        </div>
                        <Badge variant="outline">{item.externalRef}</Badge>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        A media-first annotation surface would live here. For MVP this stays a structured mock, but this is the slot that could later host Label Studio or a task-specific renderer.
                      </p>

                      <div className="hej-surface-soft mt-4 rounded-[1rem] border border-dashed border-slate-900/15 bg-stone-50/88 p-4 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Active viewport
                          </p>
                          <Badge variant="outline">{formatTaskLabel(task.taskType)}</Badge>
                        </div>
                        {isTextSpanWorkspace ? (
                          <div className="mt-4">
                            <TextSpanAnnotator
                              sourceText={resolvedContent?.content_kind === "text" ? resolvedContent.text ?? "" : item.preview}
                              spans={currentTextDrafts ?? []}
                              onChange={(nextSpans) => {
                                if (!item) return
                                setTextSpanDraftsByItemId((current) => ({
                                  ...current,
                                  [item.id]: nextSpans,
                                }))
                              }}
                              disabled={annotateDisabled || annotateActionPending}
                              labelOptions={textSpanLabelOptions}
                            />
                          </div>
                        ) : (
                          <TaskItemViewportPanel
                            mode="annotate"
                            taskType={task.taskType}
                            item={item}
                            mediaWorkspaceLabel={mediaWorkspaceLabel}
                            content={resolvedContent}
                            loading={resolvedContentLoading}
                            error={resolvedContentError}
                            currentTextDrafts={currentTextDrafts}
                            activeTextSpanId={activeTextSpanId}
                            scrollToTextSpanId={scrollToTextSpanId}
                            onTextSpanScrolled={handleTextSpanScrolled}
                            audioSegmentDrafts={audioSegmentDraftsByItemId[item.id]}
                            audioSegmentAnnotatorDisabled={annotateDisabled || annotateActionPending}
                            onImageBBoxDraftChange={(itemId, state) => {
                              setImageBBoxDraftsByItemId((current) => {
                                const previous = current[itemId]
                                if (previous && stableStringify(previous) === stableStringify(state)) {
                                  return current
                                }

                                return {
                                  ...current,
                                  [itemId]: state,
                                }
                              })
                            }}
                            onAudioSegmentDraftChange={(itemId, segments) => {
                              setAudioSegmentDraftsByItemId((current) => {
                                const previous = current[itemId] ?? []
                                if (stableStringify(previous) === stableStringify(segments)) {
                                  return current
                                }

                                return {
                                  ...current,
                                  [itemId]: segments,
                                }
                              })
                            }}
                            onTextSpanSelectionChange={setTextSpanSelection}
                          />
                        )}
                      </div>

                      {workspaceKind !== "audio_transcription" && task.taskType !== "text" ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          {["Select", "Span/Box", "Adjust"].map((tool) => (
                            <div
                              key={tool}
                              className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-200"
                            >
                              {tool}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">
                          Shared annotation rules
                        </p>
                      </div>
                      <p className="mt-3 text-[13px] leading-6 text-slate-700">
                        {task.annotationRules}
                      </p>
                    </div>

                    {isAiAssisted ? (
                      <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <Bot className="size-4 text-slate-600" />
                          <p className="text-sm font-semibold text-slate-900">
                            Candidate output
                          </p>
                        </div>
                        <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-sm font-semibold text-slate-900">{item.aiLabel}</p>
                          <p className="mt-1 text-xs text-slate-500">{`Confidence ${item.confidence}`}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Tags className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Output schema</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        {isTextSpanWorkspace
                          ? "Select the label set and produce the first-pass annotation payload."
                          : isImageRegionWorkspace
                            ? "Annotate visible objects or regions and capture the output payload for review."
                            : isAudioTranscriptionWorkspace
                              ? "Transcribe audio segments and capture labels, timestamps, and notes for review."
                              : "Use the schema below to produce a structured annotation payload."
                        }
                      </p>

                      {isTextSpanWorkspace ? (
                        <div className="mt-4 space-y-4">
                          <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Notes</label>
                            <Textarea
                              value={annotationNotes}
                              onChange={(e) => setAnnotationNotes(e.target.value)}
                              placeholder="Capture a short note for review when the boundary, timestamp, or object extent remains uncertain."
                              className="min-h-32"
                            />
                          </div>

                          <details className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3">
                            <summary className="cursor-pointer text-sm font-medium text-slate-700">
                              Legacy JSON payload
                            </summary>
                            <p className="mt-2 text-xs text-slate-500">
                              Structured spans above are used for submission. This raw JSON view is kept for compatibility and debugging.
                            </p>
                            <div className="mt-3 space-y-3">
                              <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">
                                  Annotation output
                                </label>
                                <Textarea
                                  value={textAnnotationPayloadPreview}
                                  readOnly
                                  placeholder='{"kind":"text","version":1,"text_spans":[]}'
                                  className="min-h-28 font-mono text-xs"
                                />
                                {annotationJsonError ? (
                                  <p className="text-xs text-red-600 dark:text-red-400">
                                    Invalid JSON: {annotationJsonError}
                                  </p>
                                ) : textAnnotationPayloadPreview.trim() ? (
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                    Valid JSON
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </details>
                        </div>
                      ) : isAudioTranscriptionWorkspace ? (
                        <div className="mt-4 grid gap-3">
                          <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                              Annotation output
                            </label>
                            <Textarea
                              value={audioAnnotationPayloadPreview}
                              readOnly
                              placeholder='{"kind":"audio","version":1,"segments":[]}'
                              className="min-h-28 font-mono text-xs"
                            />
                            {annotationJsonError ? (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                Invalid JSON: {annotationJsonError}
                              </p>
                            ) : audioAnnotationPayloadPreview.trim() ? (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                Valid JSON
                              </p>
                            ) : null}
                          </div>
                          <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Notes</label>
                            <Textarea
                              value={annotationNotes}
                              onChange={(e) => setAnnotationNotes(e.target.value)}
                              placeholder="Capture a short note for review when the segment timing remains uncertain."
                              className="min-h-32"
                            />
                          </div>
                        </div>
                      ) : isImageRegionWorkspace ? (
                        <div className="mt-4 grid gap-3">
                          <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                              Annotation output
                            </label>
                            <Textarea
                              value={annotationOutput}
                              onChange={(e) => setAnnotationOutput(e.target.value)}
                              placeholder='{"kind":"image_bbox","version":1,"boxes":[{"id":"box_1","label":"object","x":12,"y":24,"width":80,"height":96}],"notes":""}'
                              className="min-h-28 font-mono text-xs"
                            />
                            {textSpanSelection ? (
                              <p className="text-xs text-slate-500">
                                Text selections are ignored in image tasks. Use image boxes, labels, and notes instead.
                              </p>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!annotationOutput.trim()}
                                onClick={() => {
                                  try {
                                    setFeedback(null)
                                    setAnnotationOutput(formatAnnotationJson(annotationOutput))
                                  } catch (error) {
                                    setFeedback({
                                      kind: "error",
                                      message:
                                        error instanceof Error ? error.message : "Invalid JSON",
                                    })
                                  }
                                }}
                              >
                                Format JSON
                              </Button>
                            </div>
                            {annotationJsonError ? (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                Invalid JSON: {annotationJsonError}
                              </p>
                            ) : annotationOutput.trim() ? (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                Valid JSON
                              </p>
                            ) : null}
                          </div>
                          <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Notes</label>
                            <Textarea
                              value={annotationNotes}
                              onChange={(e) => setAnnotationNotes(e.target.value)}
                              placeholder="Capture a short note for review when the boundary, timestamp, or object extent remains uncertain."
                              className="min-h-32"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <MessageSquareQuote className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Workspace guidance</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          "Primary evidence should stay visible while labels are applied.",
                          "Annotation tools should change by media type, not by workflow stage.",
                          "Escalate ambiguity into notes instead of hiding it inside the output.",
                        ].map((line) => (
                          <div
                            key={line}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Actions</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Save draft keeps the item in Draft status for later editing. Submit moves it to Submitted and sends it for review.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          className="bg-slate-900 text-stone-100"
                          disabled={annotateDisabled || annotateActionPending}
                          onClick={() => void handleAnnotateAction("save_draft")}
                        >
                          <CheckCircle2 />
                          {pendingAnnotateAction === "save_draft" ? "Saving..." : "Save draft"}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={annotateDisabled || annotateActionPending}
                          onClick={() => void handleAnnotateAction("submit")}
                        >
                          {pendingAnnotateAction === "submit" ? "Submitting..." : "Submit annotation"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="review" className="min-h-0 flex-1 overflow-y-auto pr-1">
              {reviewDisabled && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    This item cannot be reviewed right now.
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-400">
                    Current status: {formatTaskItemStatusLabel(item.status)}.
                    {(item.status === "unstarted" || item.status === "in_progress") &&
                      " It must be submitted before review."}
                    {item.status === "approved" && " It has already been approved."}
                    {item.status === "returned" &&
                      " It was returned from review for adjustment. Open Annotate to revise and resubmit."}
                    {item.status === "rejected" &&
                      " It was rejected in review. Open Annotate to revise and resubmit."}
                    {item.status === "disputed" && " It is currently under dispute."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.status === "unstarted" ||
                    item.status === "in_progress" ||
                    item.status === "returned" ||
                    item.status === "rejected" ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => setActiveTab("annotate")}>
                        Go to {workLabel}
                      </Button>
                    ) : null}
                    {item.status === "approved" || item.status === "disputed" ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => setActiveTab("details")}>
                        Go to Item details
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
              {isJudgement ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(280px,0.96fr)]">
                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <FileSearch className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Evidence under review</p>
                      </div>
                      <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          External reference
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {item.externalRef}
                        </p>
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-900/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Source context
                        </p>
                        <p className="mt-3 text-[13px] leading-6 text-slate-700">{item.preview}</p>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Bot className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Submitted judgement</p>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Proposed verdict
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {item.reviewDecision ?? judgementValue}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{`Confidence ${judgementSignal}`}</p>
                          {judgementRationale ? (
                            <p className="mt-3 text-[13px] leading-5 text-slate-600">
                              {judgementRationale}
                            </p>
                          ) : null}
                        </div>
                        <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Reviewer focus
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            Confirm whether the verdict is grounded in the visible evidence and whether the rationale can survive escalation.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Review history</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {activity.slice(0, 3).map((event, idx) => (
                          <div
                            key={`${idx}-${event.time}-${event.action}-review-judgement`}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                              <Badge variant="outline">{event.time}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{event.actor}</p>
                            <p className="mt-2 text-[13px] leading-5 text-slate-600">{event.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Scale className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Review decision</p>
                      </div>
                      {resolvedReviewPolicy ? (
                        <div className="hej-surface-soft mt-3 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-slate-900/10 bg-slate-50 text-slate-700"
                            >
                              Task review policy
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-slate-900/10 bg-slate-50 text-slate-700"
                            >
                              {resolvedReviewPolicy.review_mode === "dual_signoff"
                                ? "Dual sign-off"
                                : "Single pass"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-slate-900/10 bg-slate-50 text-slate-700"
                            >
                              {resolvedReviewPolicy.review_required_approvals === 1
                                ? "1 approval required"
                                : `${resolvedReviewPolicy.review_required_approvals} approvals required`}
                            </Badge>
                          </div>
                          <p className="mt-2 text-[12px] leading-5 text-slate-600">
                            Task items inherit this policy from their parent task.
                          </p>
                        </div>
                      ) : null}
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Confirm, revise, or reject the submitted judgement. Escalate only when review cannot resolve the disagreement.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["accept", "revise", "reject", "escalate"].map((action) => (
                          <button
                            key={action}
                            type="button"
                            className="hej-surface-soft rounded-full border border-slate-900/10 bg-stone-50/88 px-3 py-1.5 text-sm text-slate-700 transition-[color,background-color,border-color,transform] duration-150 ease-out hover:bg-stone-100 active:scale-[0.97] dark:border-white/10 dark:text-slate-200"
                            onClick={() => setReviewVerdict(action)}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Final verdict</label>
                          <Input value={reviewVerdict} onChange={(e) => setReviewVerdict(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Review note</label>
                          <Textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Document whether the submitted judgement is accepted, revised, or rejected, and explain why."
                            className="min-h-32"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Tags className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Governance checks</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          "The final verdict reflects the visible evidence, not reviewer preference.",
                          "The review note is specific enough for a later dispute or audit.",
                          "Escalation is reserved for unresolved ambiguity, not routine corrections.",
                        ].map((line) => (
                          <div
                            key={line}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Actions</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          className="bg-slate-900 text-stone-100"
                          disabled={reviewDisabled || reviewActionPending}
                          onClick={() =>
                            handleReviewAction("approve", "accept_review")
                          }
                        >
                          <CheckCircle2 />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          disabled={reviewDisabled || reviewActionPending}
                          onClick={() =>
                            handleReviewAction("approve", "revise_review")
                          }
                        >
                          <PencilLine />
                          Revise
                        </Button>
                        <Button
                          variant="outline"
                          disabled={reviewDisabled || reviewActionPending}
                          onClick={() =>
                            handleReviewAction("reject", "reject_review")
                          }
                        >
                          <XCircle />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleReviewAction("reject", "escalate_review")
                          }
                        >
                          Escalate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {renderMediaIcon(task.taskType)}
                          <p className="text-sm font-semibold text-slate-900">
                            {mediaWorkspaceLabel}
                          </p>
                        </div>
                        <Badge variant="outline">{item.externalRef}</Badge>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Review uses the same evidence pane as annotation, but the reviewer edits or confirms the submitted result instead of producing it from scratch.
                      </p>
                      <div className="hej-surface-soft mt-4 rounded-[1rem] border border-dashed border-slate-900/15 bg-stone-50/88 p-4 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Active viewport
                          </p>
                          <Badge variant="outline">{formatTaskLabel(task.taskType)}</Badge>
                        </div>
                        <TaskItemViewportPanel
                          mode="review"
                          taskType={task.taskType}
                          item={item}
                          mediaWorkspaceLabel={mediaWorkspaceLabel}
                          content={resolvedContent}
                          loading={resolvedContentLoading}
                          error={resolvedContentError}
                          currentTextDrafts={currentTextDrafts}
                          activeTextSpanId={activeTextSpanId}
                          scrollToTextSpanId={scrollToTextSpanId}
                          onTextSpanScrolled={handleTextSpanScrolled}
                        />
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Bot className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">
                          Submitted annotation
                        </p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {hasInvalidReviewPayload ? (
                          <div
                            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
                            role="alert"
                          >
                            <p className="font-medium">Review payload could not be parsed</p>
                            <p className="mt-1 text-xs text-red-800">
                              The submitted payload is invalid JSON. Review the raw payload carefully before making a decision.
                            </p>
                          </div>
                        ) : null}
                        <AnnotationOutputPreview
                          title="Submitted payload"
                          payloadText={reviewPayloadText}
                          notes={item.draftNotes}
                          candidateLabel={item.aiLabel}
                          candidateConfidence={item.confidence}
                          candidateOutput={item.candidateOutput ?? null}
                          emptyLabel="No submitted annotation available."
                          kind={workspaceKind === "image_region" ? "image_bbox" : workspaceKind === "audio_transcription" ? "audio" : workspaceKind === "text_span" ? "text" : "json"}
                          mediaUrl={resolvedContent?.media_url ?? null}
                          alt={item.externalRef}
                          previewText={item.preview}
                          imageBoxes={
                            workspaceKind === "image_region"
                              ? item.draftAnnotationData && item.draftAnnotationData.kind === "image"
                                ? item.draftAnnotationData.boxes.map((box, index) => ({
                                    id: box.id?.trim() ? box.id.trim() : `box-${index}`,
                                    label: box.label?.trim() ? box.label.trim() : "region",
                                    x: box.x,
                                    y: box.y,
                                    width: box.width,
                                    height: box.height,
                                  }))
                                : undefined
                              : undefined
                          }
                          sourceText={
                            resolvedContent?.content_kind === "text"
                              ? resolvedContent.text ?? undefined
                              : undefined
                          }
                        />
                        <div className="rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Reviewer focus
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            Confirm label boundaries, object extents, or media timestamps before accepting the submitted annotation.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Review history</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {activity.slice(0, 3).map((event, idx) => (
                          <div
                            key={`${idx}-${event.time}-${event.action}-review-annotation`}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                              <Badge variant="outline">{event.time}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{event.actor}</p>
                            <p className="mt-2 text-[13px] leading-5 text-slate-600">{event.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Scale className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Review decision</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Confirm, adjust, or reject the submitted annotation. Escalate only when disagreement cannot be resolved inside review.
                      </p>
                      {resolvedReviewPolicy ? (
                        <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="border-slate-900/10 bg-slate-50 text-slate-700">
                              Task review policy
                            </Badge>
                            <Badge variant="outline" className="border-slate-900/10 bg-slate-50 text-slate-700">
                              {resolvedReviewPolicy.review_mode === "dual_signoff"
                                ? "Dual sign-off"
                                : "Single pass"}
                            </Badge>
                            <Badge variant="outline" className="border-slate-900/10 bg-slate-50 text-slate-700">
                              {resolvedReviewPolicy.review_required_approvals === 1
                                ? "1 approval required"
                                : `${resolvedReviewPolicy.review_required_approvals} approvals required`}
                            </Badge>
                          </div>
                          <p className="mt-2 text-[12px] leading-5 text-slate-600">
                            Task items inherit this policy from their parent task.
                          </p>
                        </div>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["accept", "adjust", "reject", "escalate"].map((action) => (
                          <button
                            key={action}
                            type="button"
                            className="hej-surface-soft rounded-full border border-slate-900/10 bg-stone-50/88 px-3 py-1.5 text-sm text-slate-700 transition-[color,background-color,border-color,transform] duration-150 ease-out hover:bg-stone-100 active:scale-[0.97] dark:border-white/10 dark:text-slate-200"
                            onClick={() => setReviewVerdict(action)}
                          >
                            {action}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">
                            Final annotation payload
                          </label>
                          <Textarea
                            value={reviewPayload}
                            onChange={(e) => setReviewPayload(e.target.value)}
                            placeholder={
                              isTextSpanWorkspace
                                ? '{"kind":"text","version":1,"text_spans":[]}'
                                : isImageRegionWorkspace
                                  ? '{"kind":"image_bbox","version":1,"boxes":[]}'
                                  : isAudioTranscriptionWorkspace
                                    ? '{"kind":"audio","version":1,"segments":[]}'
                                    : '{"output":{}}'
                            }
                            className="min-h-28 font-mono text-xs"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Review note</label>
                          <Textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Document whether the annotation is accepted, adjusted, or rejected, and explain any boundary or schema corrections."
                            className="min-h-32"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Tags className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Governance checks</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          "The final payload follows the task schema, not reviewer shorthand.",
                          "Adjustments preserve uncertainty instead of forcing a clean answer.",
                          "Escalation is used only when reviewer correction is not enough.",
                        ].map((line) => (
                          <div
                            key={line}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Actions</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          className="bg-slate-900 text-stone-100"
                          disabled={reviewDisabled || reviewActionPending}
                          onClick={() =>
                            handleReviewAction("approve", "accept_review")
                          }
                        >
                          <CheckCircle2 />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          disabled={reviewDisabled || reviewActionPending}
                          onClick={() =>
                            handleReviewAction("approve", "adjust_review")
                          }
                        >
                          <PencilLine />
                          Adjust
                        </Button>
                        <Button
                          variant="outline"
                          disabled={reviewDisabled || reviewActionPending}
                          onClick={() =>
                            handleReviewAction("reject", "reject_review")
                          }
                        >
                          <XCircle />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleReviewAction("reject", "escalate_review")
                          }
                        >
                          Escalate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function TaskItemViewportPanel({
  mode,
  taskType,
  item,
  mediaWorkspaceLabel,
  content,
  loading,
  error,
  onImageBBoxDraftChange,
  audioSegmentDrafts,
  audioSegmentAnnotatorDisabled,
  onAudioSegmentDraftChange,
  onTextSpanSelectionChange,
  currentTextDrafts,
  activeTextSpanId,
  scrollToTextSpanId,
  onTextSpanScrolled,
}: TaskItemViewportPanelProps) {
  const imageBBoxInitialBoxes = getImageBBoxInitialBoxes(item)
  const imageBBoxInitialNotes = getImageBBoxInitialNotes(item)
  const hasImageBBoxAnnotation =
    imageBBoxInitialBoxes.length > 0 || imageBBoxInitialNotes.trim().length > 0
  const [audioLoadError, setAudioLoadError] = useState(false)
  const [currentAudioTimeSeconds, setCurrentAudioTimeSeconds] = useState(0)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const audioRangeEndRef = useRef<number | null>(null)
  const resolvedAudioUrl = resolveMediaUrl(content?.media_url ?? null)
  useEffect(() => {
    setAudioLoadError(false)
    setCurrentAudioTimeSeconds(0)
    audioRangeEndRef.current = null
  }, [resolvedAudioUrl])

  const handleSeekAudio = useCallback((seconds: number) => {
    const audio = audioElementRef.current
    if (!audio || !Number.isFinite(seconds)) return
    audio.currentTime = Math.max(0, seconds)
    setCurrentAudioTimeSeconds(audio.currentTime)
    void audio.play().catch(() => {})
  }, [])

  const handlePlayAudioRange = useCallback((startSeconds: number, endSeconds: number) => {
    const audio = audioElementRef.current
    if (!audio || !Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) return
    if (startSeconds < 0 || endSeconds <= startSeconds) return
    audioRangeEndRef.current = endSeconds
    audio.currentTime = startSeconds
    setCurrentAudioTimeSeconds(audio.currentTime)
    void audio.play().catch(() => {
      audioRangeEndRef.current = null
    })
  }, [])
  const viewportText = content?.content_kind === "text" ? content.text ?? "" : ""
  const textHighlightParts = useMemo(
    () => buildTextHighlightParts(viewportText, currentTextDrafts ?? []),
    [viewportText, currentTextDrafts],
  )

  return (
    <div className="mt-4 min-h-72 rounded-[0.95rem] border border-slate-900/10 bg-white p-4">
      {loading ? (
        <p className="text-center text-[13px] text-slate-500">Loading content from location ref…</p>
      ) : error ? (
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-red-800">Could not load content</p>
          <p className="text-[13px] leading-5 text-slate-600">
            {item.locationRef ? (
              <>
                <span className="font-mono text-xs">{item.locationRef}</span>
                <br />
              </>
            ) : null}
            {error}
          </p>
          <p className="text-[13px] leading-6 text-slate-600">{item.preview}</p>
        </div>
      ) : content?.content_kind === "image" && content.media_url ? mode === "annotate" ? (
        <ImageBBoxAnnotator
          mediaUrl={content.media_url}
          alt={item.externalRef ?? item.id}
          initialBoxes={imageBBoxInitialBoxes}
          initialNotes={imageBBoxInitialNotes}
          resetKey={item.id}
          onChange={(state) => {
            onImageBBoxDraftChange?.(item.id, state)
          }}
        />
      ) : hasImageBBoxAnnotation ? (
        <ReadonlyImageBBoxPreview
          mediaUrl={content.media_url}
          alt={item.externalRef ?? item.id}
          boxes={imageBBoxInitialBoxes}
          notes={imageBBoxInitialNotes}
        />
      ) : (
        <SafeImagePreview
          src={content.media_url}
          alt={item.externalRef}
          fallbackLabel={mediaWorkspaceLabel}
          previewText={item.preview}
        />
      ) : content?.content_kind === "audio" ? (
        <div className="space-y-4">
          <div className="sticky top-4 z-20 rounded-xl border border-slate-900/10 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Source audio</p>
            {resolvedAudioUrl ? (
              <>
                <div className="mt-3">
                  <audio
                    ref={audioElementRef}
                    controls
                    preload="metadata"
                    src={resolvedAudioUrl}
                    key={resolvedAudioUrl}
                    className="w-full"
                    onTimeUpdate={(event) => {
                      const audio = event.currentTarget
                      setCurrentAudioTimeSeconds(audio.currentTime)
                      if (
                        Number.isFinite(audioRangeEndRef.current) &&
                        audio.currentTime >= (audioRangeEndRef.current as number)
                      ) {
                        audio.pause()
                        audioRangeEndRef.current = null
                      }
                    }}
                    onError={() => setAudioLoadError(true)}
                    onCanPlay={(event) => {
                      setAudioLoadError(false)
                      setCurrentAudioTimeSeconds(event.currentTarget.currentTime)
                    }}
                    onLoadedMetadata={(event) => {
                      setAudioLoadError(false)
                      setCurrentAudioTimeSeconds(event.currentTarget.currentTime)
                    }}
                    onPause={() => {
                      audioRangeEndRef.current = null
                    }}
                    onEnded={() => {
                      audioRangeEndRef.current = null
                    }}
                  />
                </div>
                <p className="mt-3 break-all text-xs text-slate-500">{resolvedAudioUrl}</p>
                {audioLoadError ? (
                  <p className="mt-2 text-xs text-amber-700">
                    The audio preview failed to load. Check that the file exists and that the resolved path is reachable.
                  </p>
                ) : null}
              </>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-slate-900/10 bg-white px-4 py-6 text-center text-sm text-slate-600">
                No source audio is available for this item.
              </div>
            )}
          </div>
          {mode === "annotate" ? (
            <AudioSegmentAnnotator
              initialSegments={audioSegmentDrafts}
              currentTimeSeconds={currentAudioTimeSeconds}
              disabled={audioSegmentAnnotatorDisabled}
              onSeekToTime={handleSeekAudio}
              onPlayRange={handlePlayAudioRange}
              onChange={(segments) => {
                onAudioSegmentDraftChange?.(item.id, segments)
              }}
            />
          ) : isAudioAnnotationData(item.draftAnnotationData) ? (
            <ReadonlyAudioSegmentsPreview
              segments={item.draftAnnotationData.segments}
              onSeekToTime={handleSeekAudio}
              onPlayRange={handlePlayAudioRange}
            />
          ) : null}
        </div>
      ) : content?.content_kind === "text" && content.text ? (
        <TextSpanViewport
          content={content}
          mode={mode}
          activeTextSpanId={activeTextSpanId}
          onTextSpanSelectionChange={onTextSpanSelectionChange}
          onTextSpanScrolled={onTextSpanScrolled}
          scrollToTextSpanId={scrollToTextSpanId}
          textHighlightParts={textHighlightParts}
        />
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-900 text-stone-100">
            {renderMediaIcon(taskType, "size-5")}
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-900">{mediaWorkspaceLabel}</p>
          <p className="mt-2 max-w-md text-[13px] leading-6 text-slate-600">{item.preview}</p>
        </div>
      )}
    </div>
  )
}

type TextSpanViewportProps = {
  mode: "annotate" | "review"
  content: ApiTaskItemContent
  activeTextSpanId?: string | null
  onTextSpanSelectionChange?: (selection: TextSpanSelection | null) => void
  onTextSpanScrolled?: () => void
  scrollToTextSpanId?: string | null
  textHighlightParts: TextHighlightPart[]
}

function TextSpanViewport({
  mode,
  content,
  activeTextSpanId,
  onTextSpanSelectionChange,
  onTextSpanScrolled,
  scrollToTextSpanId,
  textHighlightParts,
}: TextSpanViewportProps) {
  const textContentRef = useRef<HTMLSpanElement | null>(null)
  const textSpanMarkRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (!scrollToTextSpanId) return

    const node = textSpanMarkRefs.current[scrollToTextSpanId]
    if (!node) {
      onTextSpanScrolled?.()
      return
    }

    node.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })

    onTextSpanScrolled?.()
  }, [scrollToTextSpanId, onTextSpanScrolled])

  const updateTextSelection = () => {
    if (mode !== "annotate" || !onTextSpanSelectionChange || !content.text) {
      return
    }

    const container = textContentRef.current
    if (!container) {
      onTextSpanSelectionChange(null)
      return
    }

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      onTextSpanSelectionChange(null)
      return
    }

    const range = selection.getRangeAt(0)
    if (!container.contains(range.commonAncestorContainer)) {
      onTextSpanSelectionChange(null)
      return
    }

    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
      onTextSpanSelectionChange(null)
      return
    }

    const start = (() => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
      let offset = 0
      let current = walker.nextNode()
      while (current) {
        if (current === range.startContainer) {
          return offset + range.startOffset
        }
        offset += current.textContent?.length ?? 0
        current = walker.nextNode()
      }
      return -1
    })()
    const end = (() => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
      let offset = 0
      let current = walker.nextNode()
      while (current) {
        if (current === range.endContainer) {
          return offset + range.endOffset
        }
        offset += current.textContent?.length ?? 0
        current = walker.nextNode()
      }
      return -1
    })()
    if (start < 0 || end < 0 || start >= end) {
      onTextSpanSelectionChange(null)
      return
    }

    onTextSpanSelectionChange({ start, end, text: content.text.slice(start, end) })
  }

  return (
    <pre
      className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-left text-[13px] leading-6 text-slate-800"
      onMouseUp={updateTextSelection}
      onKeyUp={updateTextSelection}
    >
      <span ref={textContentRef}>
        {textHighlightParts.map((part) => {
          if (part.kind === "span") {
            const tone = getTextSpanLabelTone(part.label)
            const isActive = activeTextSpanId === part.id
            return (
              <mark
                key={part.key}
                ref={(node) => {
                  if (node) {
                    textSpanMarkRefs.current[part.id] = node
                    return
                  }

                  delete textSpanMarkRefs.current[part.id]
                }}
                className={`${tone.markClassName} transition-shadow ${isActive ? "ring-2 ring-offset-1 ring-slate-900/40 dark:ring-white/60" : ""}`}
                title={`${part.label} ${part.start}-${part.end}`}
              >
                {part.text}
              </mark>
            )
          }

          return <span key={part.key}>{part.text}</span>
        })}
      </span>
      {content.truncated ? (
        <span className="mt-2 block text-xs text-slate-500">(truncated)</span>
      ) : null}
    </pre>
  )
}

function SafeImagePreview({
  src,
  alt,
  fallbackLabel,
  previewText,
}: {
  src: string
  alt: string
  fallbackLabel: string
  previewText: string
}) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ImageIcon className="size-5" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-900">Image preview unavailable</p>
        <p className="mt-2 max-w-md text-[13px] leading-6 text-slate-600">
          {fallbackLabel} could not load from the current media address.
        </p>
        <p className="mt-3 max-w-md text-[13px] leading-6 text-slate-500">{previewText}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-64 items-center justify-center">
      <img
        src={src}
        alt={alt}
        className="max-h-80 max-w-full rounded-lg object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  )
}

function resolveMediaUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed
  }

  const baseUrl = hejApiBaseUrl.replace(/\/+$/, "")
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  return `${baseUrl}${path}`
}

type WorkspaceKind = "text_span" | "image_region" | "audio_transcription" | "generic_json"

function getWorkspaceKind(args: {
  taskType: string
  mediaType?: string | null
  annotationType?: string | null
  outputSchemaRef?: string | null
  contentKind?: string | null
}): WorkspaceKind {
  const taskType = args.taskType.trim().toLowerCase()
  const mediaType = args.mediaType?.trim().toLowerCase() ?? null
  const annotationType = args.annotationType?.trim().toLowerCase() ?? null
  const outputSchemaRef = args.outputSchemaRef?.trim().toLowerCase() ?? null
  const contentKind = args.contentKind?.trim().toLowerCase() ?? null

  if (
    taskType === "text" ||
    annotationType === "text_span" ||
    annotationType === "text_spans" ||
    outputSchemaRef?.includes("text_span") ||
    outputSchemaRef?.includes("text-span")
  ) {
    return "text_span"
  }

  if (
    taskType === "audio" ||
    mediaType === "audio" ||
    annotationType === "audio_transcription" ||
    annotationType === "audio_transcript" ||
    annotationType === "audio_segments" ||
    outputSchemaRef?.includes("audio") ||
    contentKind === "audio"
  ) {
    return "audio_transcription"
  }

  if (
    taskType === "image" ||
    mediaType === "image" ||
    annotationType === "image_region" ||
    annotationType === "image_bbox" ||
    annotationType === "bbox" ||
    outputSchemaRef?.includes("image") ||
    contentKind === "image"
  ) {
    return "image_region"
  }

  return "generic_json"
}

function getMediaWorkspaceLabel(taskType: string) {
  if (taskType === "image") return "Image annotation workspace"
  if (taskType === "text") return "Text annotation workspace"
  if (taskType === "audio") return "Audio transcription workspace"
  return "Structured annotation workspace"
}

function createEmptyAudioSegmentDraft(index = 0): AudioSegmentDraft {
  return {
    id: `segment_${index + 1}`,
    start_seconds: "",
    end_seconds: "",
    label: "",
    transcript: "",
    notes: "",
  }
}

function extractAudioSegmentsFromPayload(payloadText: string): AudioSegmentDraft[] {
  try {
    const parsed = JSON.parse(payloadText)
    const annotationData = normalizeAnnotationData(parsed, "audio")
    if (annotationData.kind !== "audio" || annotationData.segments.length === 0) {
      return []
    }
    return annotationData.segments.map(normalizeAudioSegmentDraft)
  } catch {
    return []
  }
}

function extractAudioUrlFromPayload(payloadText?: string | null): string | null {
  if (!payloadText?.trim()) return null
  try {
    const parsed = JSON.parse(payloadText)
    if (!parsed || typeof parsed !== "object") return null
    const payload = parsed as { audioUrl?: unknown; audio_url?: unknown }
    const audioUrl = payload.audioUrl ?? payload.audio_url
    return typeof audioUrl === "string" && audioUrl.trim() ? audioUrl.trim() : null
  } catch {
    return null
  }
}


function buildReviewFinalPayload(item: MockTaskItem): string {
  // MockTaskItem currently has no separate submitted payload field, so
  // draftPayloadText is the persisted payload text we can reuse in review.
  if (item.draftPayloadText && item.draftPayloadText.trim()) {
    return item.draftPayloadText
  }

  const annotationKind = item.draftAnnotationData?.kind
  if (annotationKind === "audio") {
    return JSON.stringify({ kind: "audio", version: 1, segments: [], notes: "" }, null, 2)
  }
  if (annotationKind === "text") {
    return JSON.stringify({ kind: "text", version: 1, text_spans: [], notes: "" }, null, 2)
  }
  if (annotationKind === "image") {
    return JSON.stringify({ kind: "image", version: 1, boxes: [], notes: "" }, null, 2)
  }
  return ""
}

function renderMediaIcon(taskType: string, className = "size-4") {
  if (taskType === "image") {
    return <ImageIcon className={className} />
  }
  if (taskType === "text") {
    return <FileText className={className} />
  }
  if (taskType === "audio") {
    return <Mic className={className} />
  }
  return <CircleHelp className={className} />
}
