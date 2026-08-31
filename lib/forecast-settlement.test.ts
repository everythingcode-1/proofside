import { describe, expect, it } from "vitest"
import { createForecastStore } from "./forecast-store"
import { reconcileForecastReceipts } from "./forecast-settlement"

const receipt = { id: "r1", schemaVersion: 1 as const, creatorType: "HUMAN" as const, creatorId: "0xabc", creatorWallet: "0xabc0000000000000000000000000000000000123" as `0x${string}`, marketId: "m1", marketIdHash: `0x${"1".repeat(64)}` as `0x${string}`, initialDirection: "UP" as const, initialConfidenceBps: 7000, initialJudgmentAt: 1, direction: "UP" as const, confidenceBps: 7000, thesis: "Up thesis", counterCase: "Down case", invalidationCondition: "Break below", createdAt: 1, locksAt: 2, revision: 1, previousReceiptHash: null, canonicalHash: `0x${"2".repeat(64)}` as `0x${string}`, authorizationType: "EIP712" as const, authorizationValue: "0xsig", proofState: "ANCHORED" as const }

describe("forecast settlement", () => {
  it("resolves anchored receipts from authoritative market outcome", () => {
    const store = createForecastStore(":memory:"); store.createReceipt(receipt)
    reconcileForecastReceipts(store, { id: "m1", phase: "SETTLED", outcome: "UP" }, 3000)
    expect(store.getByHash(receipt.canonicalHash)).toMatchObject({ proofState: "RESOLVED", outcome: "UP", brierScore: 0.09 })
    store.close()
  })

  it("marks void without a score", () => {
    const store = createForecastStore(":memory:"); store.createReceipt(receipt)
    reconcileForecastReceipts(store, { id: "m1", phase: "VOID", outcome: null }, 3000)
    expect(store.getByHash(receipt.canonicalHash)).toMatchObject({ proofState: "VOID", brierScore: null })
    store.close()
  })
})
