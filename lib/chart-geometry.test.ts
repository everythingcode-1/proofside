import { describe, expect, it } from "vitest"
import { chartGeometry } from "./chart-geometry"

describe("chart geometry", () => {
  it("does not draw a misleading line with fewer than two points", () => {
    expect(chartGeometry([], 800, 260, 16).line).toBe("")
    expect(chartGeometry([{ time: 1, close: 100 }], 800, 260, 16).line).toBe("")
  })

  it("draws a flat series inside the chart", () => {
    const result = chartGeometry([{ time: 1, close: 100 }, { time: 2, close: 100 }], 800, 260, 16)
    expect(result.line).toBe("M 16 130 L 784 130")
  })

  it("normalizes changing values within padded bounds", () => {
    const result = chartGeometry([{ time: 1, close: 90 }, { time: 2, close: 110 }, { time: 3, close: 100 }], 800, 260, 16)
    const numbers = result.line.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0)
    expect(result.yFor(90)).toBe(244)
    expect(result.yFor(110)).toBe(16)
  })
})
