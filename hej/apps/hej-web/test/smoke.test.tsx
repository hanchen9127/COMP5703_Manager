import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

function Smoke() {
  return React.createElement("div", null, "Hello smoke test")
}

describe("smoke test", () => {
  it("renders a trivial component", () => {
    render(React.createElement(Smoke))

    expect(screen.getByText("Hello smoke test")).toBeInTheDocument()
  })
})
