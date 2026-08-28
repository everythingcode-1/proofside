import { describe, expect, it } from "vitest"
import { openingSummary, phaseFromStatus, resultSummary } from "./lifecycle"

describe("DreamPulse lifecycle", () => {
  it("maps DreamDEX statuses without guessing settlement", () => {
    expect([0, 1, 2, 3, 4, 5].map(phaseFromStatus)).toEqual([
      "OPENING",
      "LIVE",
      "LOCKED",
      "SETTLING",
      "SETTLED",
      "VOID",
    ])
  })

  it("creates factual host copy", () => {
    expect(openingSummary({ asset: "BTC", strike: "$61,046", up: "54%", crowd: "63%" })).toContain("BTC")
    expect(resultSummary({ asset: "BTC", outcome: "UP", crowdWon: 63 })).toContain("63%")
  })
})
