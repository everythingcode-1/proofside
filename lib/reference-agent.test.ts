import { describe, expect, it } from "vitest"
import { buildReferenceForecast } from "./reference-agent"

describe("buildReferenceForecast", () => {
  it("builds an UP forecast from an above-strike market", () => {
    const result = buildReferenceForecast({ asset: "BTC", strike: "100000", oraclePrice: 101000, upPrice: 0.62, observedAt: 1_000 })

    expect(result.direction).toBe("UP")
    expect(result.confidenceBps).toBe(6200)
    expect(result.thesis).toContain("above the 100,000.00 strike")
    expect(result.counterCase).toBeTruthy()
    expect(result.invalidationCondition).toBeTruthy()
  })

  it("uses market probability for DOWN and clamps confidence", () => {
    const result = buildReferenceForecast({ asset: "ETH", strike: "5000", oraclePrice: 4900, upPrice: 0.08, observedAt: 2_000 })

    expect(result.direction).toBe("DOWN")
    expect(result.confidenceBps).toBe(8500)
    expect(result.evidence).toEqual({ oraclePrice: 4900, strike: 5000, upPrice: 0.08, observedAt: 2_000 })
  })
})
