import { describe, expect, it } from "vitest"
import { proofsideInterpretation } from "./market-provenance"

describe("market provenance", () => {
  it("reports pricing and social context without rewriting the canonical rule", () => {
    const text = proofsideInterpretation({ upPrice: 0.03 }, { upPercent: 50 })
    expect(text).toBe("DreamDEX currently prices UP at 3¢. Proofside social conviction is 50% UP.")
    expect(text).not.toMatch(/finish|above|below|opening price/i)
  })

  it("remains honest when the order book has no quote", () => {
    expect(proofsideInterpretation({ upPrice: null }, { upPercent: 50 }))
      .toBe("DreamDEX has no executable UP quote in the current snapshot. Proofside social conviction is 50% UP.")
  })
})
