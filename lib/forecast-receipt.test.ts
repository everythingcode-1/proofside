import { describe, expect, it } from "vitest"
import { buildForecastPayload, hashForecastPayload, validateForecastInput } from "./forecast-receipt"

const input = {
  creatorType: "HUMAN" as const,
  creatorId: "0xAbC0000000000000000000000000000000000123",
  creatorWallet: "0xAbC0000000000000000000000000000000000123" as `0x${string}`,
  marketId: "ETH-0-29AUG26-0400-C771/tUSDC#YES",
  initialDirection: "DOWN" as const,
  initialConfidenceBps: 5400,
  initialJudgmentAt: 1_776_999_990_000,
  direction: "UP" as const,
  confidenceBps: 7200,
  thesis: "ETH demand remains stronger than the opening print.",
  counterCase: "A rapid risk-off move can reverse momentum.",
  invalidationCondition: "Price breaks the opening level before lock.",
  createdAt: 1_777_000_000_000,
  locksAt: 1_777_000_300_000,
  revision: 1,
  previousReceiptHash: null,
}

describe("forecast receipt", () => {
  it("produces a stable hash from normalized content", () => {
    const first = buildForecastPayload(input)
    const second = buildForecastPayload({ ...input, creatorWallet: input.creatorWallet.toLowerCase() as `0x${string}`, marketId: input.marketId.toLowerCase() })
    expect(hashForecastPayload(first)).toBe(hashForecastPayload(second))
  })

  it("changes hash when confidence changes", () => {
    expect(hashForecastPayload(buildForecastPayload(input))).not.toBe(hashForecastPayload(buildForecastPayload({ ...input, confidenceBps: 7100 })))
  })

  it("commits the initial belief separately from the final decision", () => {
    const revised = hashForecastPayload(buildForecastPayload(input))
    const unchanged = hashForecastPayload(buildForecastPayload({ ...input, initialDirection: "UP" }))
    expect(revised).not.toBe(unchanged)
  })

  it("rejects certainty and missing argument quality", () => {
    expect(validateForecastInput({ ...input, confidenceBps: 10_000 })).toContain("Confidence")
    expect(validateForecastInput({ ...input, counterCase: "" })).toContain("Counter-case")
  })
})
