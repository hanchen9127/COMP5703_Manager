export type AnnotationMetadata = Record<string, unknown>

export type TextSpanAnnotation = {
  id: string
  start_offset: number
  end_offset: number
  label: string
  text?: string
  notes?: string
  // Legacy compatibility for older span payloads used by the workspace draft layer.
  start?: number
  end?: number
}

export type TextSpanAnnotationData = {
  kind: "text" | "text_span"
  version?: number
  spans?: TextSpanAnnotation[]
  text_spans?: TextSpanAnnotation[]
}

export type TextAnnotationData = {
  kind: "text"
  text?: string
  spans?: TextSpanAnnotation[]
  metadata?: AnnotationMetadata
}

export type ImageBoxAnnotation = {
  id?: string
  label?: string
  x: number
  y: number
  width: number
  height: number
  metadata?: AnnotationMetadata
}

export type ImageAnnotationData = {
  kind: "image"
  imageUrl?: string
  boxes: ImageBoxAnnotation[]
  metadata?: AnnotationMetadata
}

export type AudioSegmentAnnotation = {
  id: string
  start_seconds: number
  end_seconds: number
  label?: string
  transcript?: string
  notes?: string
  metadata?: AnnotationMetadata
}

export type AudioAnnotationData = {
  kind: "audio"
  audioUrl?: string
  segments: AudioSegmentAnnotation[]
  metadata?: AnnotationMetadata
}

export type AnnotationData = TextAnnotationData | TextSpanAnnotationData | ImageAnnotationData | AudioAnnotationData

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null
}

function normalizeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed === "" ? fallback : trimmed
  }
  if (value == null) return fallback
  const s = String(value).trim()
  return s === "" ? fallback : s
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function normalizeMetadata(
  raw: Record<string, unknown>,
  allowedKeys: readonly string[]
): AnnotationMetadata | undefined {
  const metadata: AnnotationMetadata = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!allowedKeys.includes(key)) {
      metadata[key] = value
    }
  }
  return Object.keys(metadata).length > 0 ? metadata : undefined
}

function normalizeBox(raw: unknown): ImageBoxAnnotation | null {
  if (!isRecord(raw)) return null
  const x = normalizeNumber(raw.x, Number.NaN)
  const y = normalizeNumber(raw.y, Number.NaN)
  const width = normalizeNumber(raw.width, Number.NaN)
  const height = normalizeNumber(raw.height, Number.NaN)
  if (![x, y, width, height].every(Number.isFinite)) return null

  const id = normalizeString(raw.id)
  const label = normalizeString(raw.label)
  const metadata = normalizeMetadata(raw, ["id", "label", "x", "y", "width", "height"])
  return {
    ...(id ? { id } : {}),
    ...(label ? { label } : {}),
    x,
    y,
    width,
    height,
    ...(metadata ? { metadata } : {}),
  }
}

function normalizeBoxes(raw: unknown): ImageBoxAnnotation[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeBox).filter((box): box is ImageBoxAnnotation => box != null)
}

function normalizeAudioTime(value: unknown): number {
  return normalizeNumber(value, Number.NaN)
}

function normalizeAudioSegment(raw: unknown, index: number): AudioSegmentAnnotation | null {
  if (!isRecord(raw)) return null
  const start_seconds = normalizeAudioTime(raw.start_seconds ?? raw.start ?? raw.startTime)
  const end_seconds = normalizeAudioTime(raw.end_seconds ?? raw.end ?? raw.endTime)
  if (!Number.isFinite(start_seconds) || !Number.isFinite(end_seconds) || end_seconds < start_seconds) {
    return null
  }
  const id = normalizeString(raw.id, `segment_${index + 1}`)
  const label = normalizeString(raw.label ?? raw.category)
  const transcript = normalizeString(raw.transcript ?? raw.text)
  const notes = normalizeString(raw.notes ?? raw.note)
  const metadata = normalizeMetadata(raw, [
    "id",
    "start_seconds",
    "start",
    "startTime",
    "end_seconds",
    "end",
    "endTime",
    "label",
    "category",
    "transcript",
    "text",
    "notes",
    "note",
  ])
  return {
    id,
    start_seconds,
    end_seconds,
    ...(label ? { label } : {}),
    ...(transcript ? { transcript } : {}),
    ...(notes ? { notes } : {}),
    ...(metadata ? { metadata } : {}),
  }
}

function normalizeAudioSegments(raw: unknown): AudioSegmentAnnotation[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeAudioSegment).filter((segment): segment is AudioSegmentAnnotation => segment != null)
}

function normalizeTextSpan(raw: unknown, index: number): TextSpanAnnotation | null {
  if (!isRecord(raw)) return null
  const start_offset = normalizeNumber(raw.start_offset ?? raw.start ?? raw.startIndex, Number.NaN)
  const end_offset = normalizeNumber(raw.end_offset ?? raw.end ?? raw.endIndex, Number.NaN)
  const label = normalizeString(raw.label)
  if (!Number.isFinite(start_offset) || !Number.isFinite(end_offset) || end_offset <= start_offset || !label) {
    return null
  }

  const id = normalizeString(raw.id, `span_${index + 1}`)
  const text = normalizeString(raw.text)
  const notes = normalizeString(raw.notes)
  return {
    id,
    start_offset,
    end_offset,
    label,
    ...(text ? { text } : {}),
    ...(notes ? { notes } : {}),
  }
}

function collectTextSpanCandidates(data: Record<string, unknown>): unknown[] {
  const candidates: unknown[] = []
  if (Array.isArray(data.spans)) candidates.push(...data.spans)
  if (Array.isArray(data.text_spans)) candidates.push(...data.text_spans)
  return candidates
}

export function getTextSpanAnnotations(data: unknown): TextSpanAnnotation[] {
  if (!isRecord(data)) return []
  return collectTextSpanCandidates(data)
    .map(normalizeTextSpan)
    .filter((span): span is TextSpanAnnotation => span != null)
}

export function isTextSpanAnnotationData(data: unknown): data is TextSpanAnnotationData {
  return getTextSpanAnnotations(data).length > 0
}

function pickImageAnnotationCandidate(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = getRecord(raw.output)
  if (nested && (nested.kind === "image_bbox" || nested.kind === "image")) {
    return nested
  }
  return raw
}

function collectImageMetadata(
  raw: Record<string, unknown>,
  candidate: Record<string, unknown>,
  notes?: string
): AnnotationMetadata | undefined {
  const metadata: AnnotationMetadata = {}
  const annotationKind = normalizeString(candidate.kind || raw.kind)
  if (annotationKind === "image_bbox") {
    metadata.annotationKind = "image_bbox"
  }

  const version = candidate.version ?? raw.version
  if (version != null) {
    metadata.version = version
  }

  if (notes) {
    metadata.notes = notes
  }

  const candidateMetadata = normalizeMetadata(candidate, [
    "kind",
    "version",
    "imageUrl",
    "image_url",
    "boxes",
    "annotations",
    "regions",
    "items",
    "notes",
  ])
  if (candidateMetadata) {
    Object.assign(metadata, candidateMetadata)
  }

  const rawMetadata = normalizeMetadata(raw, [
    "kind",
    "version",
    "output",
    "imageUrl",
    "image_url",
    "boxes",
    "annotations",
    "regions",
    "items",
    "notes",
  ])
  if (rawMetadata) {
    Object.assign(metadata, rawMetadata)
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined
}

function normalizeImageAnnotationData(raw: Record<string, unknown>): ImageAnnotationData {
  const candidate = pickImageAnnotationCandidate(raw)
  const nestedOutput = getRecord(raw.output)
  const candidateBoxes = normalizeBoxes(
    candidate.boxes ?? candidate.annotations ?? candidate.regions ?? candidate.items
  )
  const rawBoxes = normalizeBoxes(raw.boxes ?? raw.annotations ?? raw.regions ?? raw.items)
  const boxes = candidateBoxes.length > 0 ? candidateBoxes : rawBoxes

  const imageUrl = normalizeString(
    candidate.imageUrl ??
      candidate.image_url ??
      raw.imageUrl ??
      raw.image_url ??
      nestedOutput?.imageUrl ??
      nestedOutput?.image_url
  )

  const notes = normalizeString(candidate.notes ?? raw.notes ?? nestedOutput?.notes)
  const metadata = collectImageMetadata(raw, candidate, notes || undefined)

  return {
    kind: "image",
    ...(imageUrl ? { imageUrl } : {}),
    boxes,
    ...(metadata ? { metadata } : {}),
  }
}

function pickAudioAnnotationCandidate(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = getRecord(raw.output)
  if (nested && (nested.kind === "audio_segments" || nested.kind === "audio")) {
    return nested
  }
  return raw
}

function collectAudioMetadata(
  raw: Record<string, unknown>,
  candidate: Record<string, unknown>,
): AnnotationMetadata | undefined {
  const metadata: AnnotationMetadata = {}
  const annotationKind = normalizeString(candidate.kind || raw.kind)
  if (annotationKind) {
    metadata.annotationKind = annotationKind
  }
  const version = candidate.version ?? raw.version
  if (version != null) {
    metadata.version = version
  }
  const candidateMetadata = normalizeMetadata(candidate, [
    "kind",
    "version",
    "audioUrl",
    "audio_url",
    "audio_segments",
    "segments",
  ])
  if (candidateMetadata) Object.assign(metadata, candidateMetadata)
  const rawMetadata = normalizeMetadata(raw, [
    "kind",
    "version",
    "output",
    "audioUrl",
    "audio_url",
    "audio_segments",
    "segments",
  ])
  if (rawMetadata) Object.assign(metadata, rawMetadata)
  return Object.keys(metadata).length > 0 ? metadata : undefined
}

function normalizeAudioAnnotationData(raw: Record<string, unknown>): AudioAnnotationData {
  const candidate = pickAudioAnnotationCandidate(raw)
  const segments = normalizeAudioSegments(candidate.audio_segments ?? candidate.segments ?? raw.audio_segments ?? raw.segments)
  const audioUrl = normalizeString(
    candidate.audioUrl ?? candidate.audio_url ?? raw.audioUrl ?? raw.audio_url
  )
  const metadata = collectAudioMetadata(raw, candidate)
  return {
    kind: "audio",
    ...(audioUrl ? { audioUrl } : {}),
    segments,
    ...(metadata ? { metadata } : {}),
  }
}

export function normalizeAnnotationData(raw: unknown, taskType: "text" | "image" | "audio"): AnnotationData {
  if (!isRecord(raw)) {
    return taskType === "image"
      ? { kind: "image", boxes: [] }
      : taskType === "audio"
        ? { kind: "audio", segments: [] }
        : { kind: "text", text: "" }
  }

  if (taskType === "image") {
    return normalizeImageAnnotationData(raw)
  }
  if (taskType === "audio") {
    return normalizeAudioAnnotationData(raw)
  }

  const text = normalizeString(raw.text ?? raw.output_text ?? raw.output ?? raw.value ?? raw.content)
  const metadata = normalizeMetadata(raw, ["kind", "text", "output_text", "output", "value", "content"])
  return {
    kind: "text",
    text,
    ...(metadata ? { metadata } : {}),
  }
}
