import { describe, expect, it } from "vitest"
import { buildDecisionBrief } from "./decision-brief"

const market = {
  asset: "BTC" as const,
  upPrice: 0.56,
  downPrice: 0.44,
}

describe("decision brief", () => {
  it("turns a live odds move into a concise change instead of a refresh message", () => {
    const brief = buildDecisionBrief({ market, previousUpPrice: 0.48, judgment: "UP", signals: [] })

    expect(brief.changes[0]).toContain("8¢")
    expect(brief.changes[0]).toContain("UP")
    expect(brief.marketRead).toContain("56¢")
  })

  it("separates supporting and opposing agent evidence relative to the human judgment", () => {
    const brief = buildDecisionBrief({
      market,
      previousUpPrice: 0.54,
      judgment: "UP",
      signals: [
        { direction: "UP", confidence: 72, reason: "Bid pressure is strengthening.", agentName: "Momentum" },
        { direction: "DOWN", confidence: 61, reason: "The move lacks volume confirmation.", agentName: "Skeptic" },
      ],
    })

    expect(brief.support[0]).toContain("Bid pressure")
    expect(brief.counter[0]).toContain("lacks volume")
    expect(brief.consensus).toBe("SPLIT")
  })

  it("does not fabricate agent reasoning when no verified signal exists", () => {
    const brief = buildDecisionBrief({ market, previousUpPrice: null, judgment: "DOWN", signals: [] })

    expect(brief.support).toEqual([])
    expect(brief.counter).toEqual([])
    expect(brief.consensus).toBe("NO_SIGNAL")
  })

  it("turns strongly opposing executable odds into an explicit market challenge", () => {
    const brief = buildDecisionBrief({
      market: { ...market, upPrice: 0.2, downPrice: 0.8 },
      previousUpPrice: 0.22,
      judgment: "UP",
      signals: [],
    })

    expect(brief.marketChallenge).toContain("20¢")
    expect(brief.marketChallenge).toContain("opposes")
  })
})
