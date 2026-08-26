export type AnnotationModality = "text" | "image" | "audio" | "unknown"
export type AnnotationType = "text_json" | "image_bbox" | "audio_segments" | "legacy"

export type CanonicalTextJsonOutput = {
  kind: "text_json"
  version: 1
  data: unknown
}

export type CanonicalImageBBoxBox = {
  id?: string
  label?: string
  x: number
  y: number
  width: number
  height: number
}

export type CanonicalImageBBoxOutput = {
  kind: "image_bbox"
  version: 1
  imageUrl?: string | null
  boxes: CanonicalImageBBoxBox[]
  notes?: string | null
}

export type CanonicalAudioSegment = {
  id?: string
  label?: string
  speaker?: string
  startTime: number
  endTime: number
  transcript?: string
  confidence?: number
}

export type CanonicalAudioSegmentsOutput = {
  kind: "audio_segments"
  version: 1
  audioUrl?: string | null
  timeUnit: "seconds"
  segments: CanonicalAudioSegment[]
  notes?: string | null
}

export type CanonicalAnnotationOutput =
  | CanonicalTextJsonOutput
  | CanonicalImageBBoxOutput
  | CanonicalAudioSegmentsOutput

export type CanonicalAnnotationRecord = {
  modality: AnnotationModality
  annotationType: AnnotationType
  output: CanonicalAnnotationOutput | string | null
  outputText?: string | null
  notes?: string | null
}

export function parseAnnotationPayloadText(payloadText?: string | null): unknown | null {
  const trimmed = typeof payloadText === "string" ? payloadText.trim() : ""
  if (!trimmed) return null

  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

export function isAnnotationRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function getAnnotationKind(value: unknown): string | null {
  if (!isAnnotationRecord(value)) return null
  const kind = value.kind
  return typeof kind === "string" && kind.trim() !== "" ? kind.trim().toLowerCase() : null
}

export function isImageBBoxAnnotationKind(kind: string | null): boolean {
  return kind === "image_bbox" || kind === "image_annotation" || kind === "bbox"
}

export function isAudioAnnotationKind(kind: string | null): boolean {
  return (
    kind === "audio" ||
    kind === "audio_annotation" ||
    kind === "audio_transcription" ||
    kind === "audio_transcript" ||
    kind === "audio_segment" ||
    kind === "audio_segments"
  )
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined
}

function normalizeImageBBoxOutput(value: Record<string, unknown>, mediaUrl?: string | null): CanonicalImageBBoxOutput {
  const boxes: CanonicalImageBBoxBox[] = Array.isArray(value.boxes)
    ? value.boxes.flatMap((box) => {
        if (!isAnnotationRecord(box)) return []
        const x = box.x
        const y = box.y
        const width = box.width
        const height = box.height
        if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(width) || !isFiniteNumber(height)) {
          return []
        }
        const id = toOptionalString(box.id)
        const label = toOptionalString(box.label)
        return [
          {
            ...(id ? { id } : {}),
            ...(label ? { label } : {}),
            x,
            y,
            width,
            height,
          },
        ]
      })
    : []

  return {
    kind: "image_bbox",
    version: 1,
    imageUrl: typeof value.imageUrl === "string" ? value.imageUrl : mediaUrl ?? null,
    boxes,
    ...(typeof value.notes === "string" ? { notes: value.notes } : {}),
  }
}

function normalizeAudioSegmentsOutput(value: Record<string, unknown>, mediaUrl?: string | null): CanonicalAudioSegmentsOutput {
  const segments: CanonicalAudioSegment[] = Array.isArray(value.segments)
    ? value.segments.flatMap((segment) => {
        if (!isAnnotationRecord(segment)) return []
        const startTime = isFiniteNumber(segment.startTime)
          ? segment.startTime
          : isFiniteNumber(segment.start_time)
            ? segment.start_time
            : null
        const endTime = isFiniteNumber(segment.endTime)
          ? segment.endTime
          : isFiniteNumber(segment.end_time)
            ? segment.end_time
            : null
        if (startTime === null || endTime === null) return []
        const id = toOptionalString(segment.id)
        const label = toOptionalString(segment.label)
        const speaker = toOptionalString(segment.speaker)
        const transcript = toOptionalString(segment.transcript)
        return [
          {
            ...(id ? { id } : {}),
            ...(label ? { label } : {}),
            ...(speaker ? { speaker } : {}),
            startTime,
            endTime,
            ...(transcript ? { transcript } : {}),
            ...(isFiniteNumber(segment.confidence) ? { confidence: segment.confidence } : {}),
          },
        ]
      })
    : []

  return {
    kind: "audio_segments",
    version: 1,
    audioUrl: typeof value.audioUrl === "string" ? value.audioUrl : mediaUrl ?? null,
    timeUnit: "seconds",
    segments,
    ...(typeof value.notes === "string" ? { notes: value.notes } : {}),
  }
}

function isPlainObjectPayload(value: unknown): value is Record<string, unknown> {
  return isAnnotationRecord(value)
}

function normalizeAnnotationType(annotationType?: string | null): string | null {
  return typeof annotationType === "string" && annotationType.trim() !== ""
    ? annotationType.trim().toLowerCase()
    : null
}

export function detectAnnotationModality(input: {
  payloadObject?: unknown
  payloadText?: string | null
  annotationType?: string | null
}): AnnotationModality {
  const candidate =
    input.payloadObject !== undefined
      ? input.payloadObject
      : parseAnnotationPayloadText(input.payloadText)

  const kind = getAnnotationKind(candidate)
  const annotationType = normalizeAnnotationType(input.annotationType)

  if (isImageBBoxAnnotationKind(kind) || annotationType === "image_bbox") {
    return "image"
  }
  if (isAudioAnnotationKind(kind) || annotationType === "audio_segments") {
    return "audio"
  }

  if (isPlainObjectPayload(candidate)) {
    return "text"
  }

  const payloadText = typeof input.payloadText === "string" ? input.payloadText : ""
  return payloadText.trim() ? "text" : "unknown"
}

export function normalizeAnnotationRecord(input: {
  payloadObject?: unknown
  payloadText?: string | null
  notes?: string | null
  annotationType?: string | null
  mediaUrl?: string | null
}): CanonicalAnnotationRecord {
  const payloadObject = input.payloadObject
  const parsedText = payloadObject === undefined ? parseAnnotationPayloadText(input.payloadText) : null
  const candidate = payloadObject !== undefined ? payloadObject : parsedText
  const payloadText = typeof input.payloadText === "string" ? input.payloadText : null
  const trimmedText = payloadText?.trim() ?? ""
  const annotationType = normalizeAnnotationType(input.annotationType)
  const notes = typeof input.notes === "string" ? input.notes : null

  if (candidate === null || candidate === undefined) {
    if (trimmedText) {
      return {
        modality: "text",
        annotationType: "legacy",
        output: trimmedText,
        outputText: payloadText,
        notes,
      }
    }
    return {
      modality: "unknown",
      annotationType: "legacy",
      output: null,
      outputText: payloadText,
      notes,
    }
  }

  if (typeof candidate === "string") {
    const candidateText = candidate.trim()
    if (!candidateText) {
      return {
        modality: "unknown",
        annotationType: "legacy",
        output: null,
        outputText: payloadText,
        notes,
      }
    }
    return {
      modality: "text",
      annotationType: "legacy",
      output: candidateText,
      outputText: payloadText,
      notes,
    }
  }

  if (isAnnotationRecord(candidate)) {
    const kind = getAnnotationKind(candidate)
    if (isImageBBoxAnnotationKind(kind) || annotationType === "image_bbox") {
      return {
        modality: "image",
        annotationType: "image_bbox",
        output: normalizeImageBBoxOutput(candidate, input.mediaUrl),
        outputText: payloadText,
        notes,
      }
    }

    if (isAudioAnnotationKind(kind) || annotationType === "audio_segments") {
      return {
        modality: "audio",
        annotationType: "audio_segments",
        output: normalizeAudioSegmentsOutput(candidate, input.mediaUrl),
        outputText: payloadText,
        notes,
      }
    }

    return {
      modality: "text",
      annotationType: "text_json",
      output: {
        kind: "text_json",
        version: 1,
        data: candidate,
      },
      outputText: payloadText,
      notes,
    }
  }

  return {
    modality: "text",
    annotationType: "text_json",
    output: {
      kind: "text_json",
      version: 1,
      data: candidate,
    },
    outputText: payloadText,
    notes,
  }
}
