import React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { AnnotationOutputPreview } from "./annotation-output-preview"

afterEach(() => {
  cleanup()
})

describe("AnnotationOutputPreview payload status labels", () => {
  it("shows structured text payload label", () => {
    render(
      <AnnotationOutputPreview
        payloadText={JSON.stringify({
          kind: "text",
          spans: [
            {
              id: "span-1",
              start_offset: 0,
              end_offset: 5,
              label: "entity",
              text: "Hello",
            },
          ],
        })}
      />,
    )

    expect(screen.getByText("Structured text payload")).toBeInTheDocument()
  })

  it("shows structured image payload label", () => {
    render(
      <AnnotationOutputPreview
        payloadText={JSON.stringify({
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
        })}
      />,
    )

    expect(screen.getByText("Structured image payload")).toBeInTheDocument()
  })

  it("shows structured audio payload label", () => {
    render(
      <AnnotationOutputPreview
        payloadText={JSON.stringify({
          kind: "audio",
          segments: [
            {
              id: "segment-1",
              start_seconds: 0,
              end_seconds: 1.5,
              transcript: "hello",
            },
          ],
        })}
      />,
    )

    expect(screen.getByText("Structured audio payload")).toBeInTheDocument()
  })

  it("shows raw json payload label", () => {
    render(<AnnotationOutputPreview payloadText={JSON.stringify({ foo: "bar" })} />)

    expect(screen.getByText("Raw JSON payload")).toBeInTheDocument()
  })

  it("shows invalid json payload label", () => {
    render(<AnnotationOutputPreview payloadText="{invalid" />)

    expect(screen.getByText("Invalid JSON payload")).toBeInTheDocument()
  })

  it("shows no payload label", () => {
    render(<AnnotationOutputPreview payloadText="   " />)

    expect(screen.getByText("No payload")).toBeInTheDocument()
  })
  it("shows structured text payload label when payloadObject is provided without payloadText", () => {
    render(
      <AnnotationOutputPreview
        payloadObject={{
          kind: "text",
          version: 1,
          spans: [
            {
              id: "span-1",
              start_offset: 0,
              end_offset: 5,
              label: "claim",
              text: "Hello",
            },
          ],
        }}
        sourceText="Hello world"
      />,
    )

    expect(screen.getByText("Structured text payload")).toBeInTheDocument()
  })

})
