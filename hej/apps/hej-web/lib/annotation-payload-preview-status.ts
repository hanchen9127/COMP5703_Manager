import { getTextSpanAnnotations, normalizeAnnotationData } from "@/lib/annotation-data"

export type AnnotationPayloadPreviewStatus =
  | "no_payload"
  | "invalid_json"
  | "structured_text"
  | "structured_image"
  | "structured_audio"
  | "raw_json"

export const annotationPayloadPreviewStatusLabels: Record<AnnotationPayloadPreviewStatus, string> = {
  no_payload: "No payload",
  invalid_json: "Invalid JSON payload",
  structured_text: "Structured text payload",
  structured_image: "Structured image payload",
  structured_audio: "Structured audio payload",
  raw_json: "Raw JSON payload",
}

export function getAnnotationPayloadPreviewStatus(
  payloadText: string | null | undefined,
  payloadObject?: unknown,
): AnnotationPayloadPreviewStatus {
  const hasPayloadObject = typeof payloadObject !== "undefined"
  const trimmedPayloadText = payloadText?.trim() ?? ""

  if (!hasPayloadObject && !trimmedPayloadText) {
    return "no_payload"
  }

  let parsed: unknown
  if (hasPayloadObject) {
    parsed = payloadObject
  } else {
    try {
      parsed = JSON.parse(payloadText as string)
    } catch {
      return "invalid_json"
    }
  }

  const textSpans = getTextSpanAnnotations(parsed)
  if (textSpans.length > 0) return "structured_text"

  try {
    const imageData = normalizeAnnotationData(parsed, "image")
    if (imageData.kind === "image" && imageData.boxes.length > 0) return "structured_image"
  } catch {
    // Fall through to other checks.
  }

  try {
    const audioData = normalizeAnnotationData(parsed, "audio")
    if (audioData.kind === "audio" && audioData.segments.length > 0) return "structured_audio"
  } catch {
    // Fall through to raw JSON.
  }

  return "raw_json"
}
