import { describe, expect, it } from "vitest"

import { getAnnotationPayloadPreviewStatus } from "./annotation-payload-preview-status"

describe("getAnnotationPayloadPreviewStatus", () => {
  it("returns no_payload for empty payload", () => {
    expect(getAnnotationPayloadPreviewStatus("   ")).toBe("no_payload")
  })

  it("returns invalid_json for malformed json", () => {
    expect(getAnnotationPayloadPreviewStatus("{invalid")).toBe("invalid_json")
  })

  it("returns raw_json for valid but unstructured payload", () => {
    expect(getAnnotationPayloadPreviewStatus(JSON.stringify({ foo: "bar" }))).toBe("raw_json")
  })

  it("returns structured_text for text payload via payloadText", () => {
    const payload = {
      kind: "text",
      spans: [
        {
          id: "span-1",
          start_offset: 0,
          end_offset: 5,
          text: "Hello",
          label: "entity",
        },
      ],
    }

    expect(getAnnotationPayloadPreviewStatus(JSON.stringify(payload))).toBe("structured_text")
  })

  it("returns structured_image for image payload via payloadText", () => {
    const payload = {
      kind: "image",
      boxes: [
        {
          id: "box-1",
          label: "object",
          x: 10,
          y: 20,
          width: 100,
          height: 80,
        },
      ],
    }

    expect(getAnnotationPayloadPreviewStatus(JSON.stringify(payload))).toBe("structured_image")
  })

  it("returns structured_audio for audio payload via payloadText", () => {
    const payload = {
      kind: "audio",
      segments: [
        {
          id: "seg-1",
          start_seconds: 0,
          end_seconds: 1.5,
          transcript: "hello",
        },
      ],
    }

    expect(getAnnotationPayloadPreviewStatus(JSON.stringify(payload))).toBe("structured_audio")
  })

  it("returns structured_text for text payload via payloadObject", () => {
    const payloadObject = {
      kind: "text",
      spans: [
        {
          id: "span-1",
          start_offset: 0,
          end_offset: 5,
          text: "Hello",
          label: "entity",
        },
      ],
    }

    expect(getAnnotationPayloadPreviewStatus(undefined, payloadObject)).toBe("structured_text")
  })
})
