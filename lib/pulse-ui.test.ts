import { describe, expect, it } from "vitest"

import { pulseStage, speedLabel } from "./pulse-ui"

describe("native pulse UI", () => {
  it("maps live transaction progress to a factual pulse stage", () => {
    expect(pulseStage("LIVE", "IDLE")).toBe("MARKET")
    expect(pulseStage("LIVE", "AWAITING_SIGNATURE")).toBe("SIGNATURE")
    expect(pulseStage("LIVE", "SUBMITTED")).toBe("SOMNIA")
    expect(pulseStage("LIVE", "CONFIRMED")).toBe("PROOF")
    expect(pulseStage("STALE", "BLOCKED")).toBe("ATTENTION")
  })

  it("only describes measured verification time", () => {
    expect(speedLabel(null)).toBe("Live verification")
    expect(speedLabel(Number.NaN)).toBe("Live verification")
    expect(speedLabel(-10)).toBe("Verified in 0.00s")
    expect(speedLabel(1_240)).toBe("Verified in 1.24s")
  })
})
