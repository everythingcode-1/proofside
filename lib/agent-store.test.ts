import { describe, expect, it } from "vitest"
import { createAgentStore } from "./agent-store"

describe("agent store", () => {
  it("consumes a challenge only once", () => {
    const store = createAgentStore(":memory:")
    store.saveChallenge({ nonce: "n1", wallet: "0xAbC", purpose: "REGISTER", expiresAt: 2_000 })

    expect(store.consumeChallenge("n1", "0xabc", "REGISTER", 1_000)).toBe(true)
    expect(store.consumeChallenge("n1", "0xabc", "REGISTER", 1_000)).toBe(false)
    store.close()
  })

  it("rejects an expired challenge", () => {
    const store = createAgentStore(":memory:")
    store.saveChallenge({ nonce: "n1", wallet: "0xabc", purpose: "REGISTER", expiresAt: 999 })

    expect(store.consumeChallenge("n1", "0xabc", "REGISTER", 1_000)).toBe(false)
    store.close()
  })

  it("keeps signal revisions append-only", () => {
    const store = createAgentStore(":memory:")
    const first = store.appendPrediction({ marketId: "M1", actorType: "AGENT", actorId: "A1", direction: "UP", confidence: 70, reason: "first", createdAt: 100 })
    const second = store.appendPrediction({ marketId: "m1", actorType: "AGENT", actorId: "a1", direction: "DOWN", confidence: 80, reason: "revised", createdAt: 200 })

    expect(second.supersedesId).toBe(first.id)
    expect(store.getPredictionHistory("m1", "AGENT", "a1")).toHaveLength(2)
    expect(store.getEffectivePrediction("m1", "AGENT", "a1", 150)?.direction).toBe("UP")
    store.close()
  })
})
