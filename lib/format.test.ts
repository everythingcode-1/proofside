import { describe, expect, it } from "vitest"
import { countdownLabel, durationLabel, formatProbability, formatUnitsSafe } from "./format"

describe("integer-safe formatting", () => {
  it("formats testnet collateral and probabilities", () => {
    expect(formatUnitsSafe(61_046_000000n, 6, 2)).toBe("61,046.00")
    expect(formatProbability(540_000n, 6)).toBe("54%")
  })

  it("formats market timing", () => {
    expect(durationLabel(900)).toBe("15m")
    expect(countdownLabel(1_060, 1_000_000)).toBe("01:00")
  })
})
