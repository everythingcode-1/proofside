import { describe, expect, it } from "vitest"
import { createForecastStore } from "./forecast-store"

const receipt = {
  id: "receipt-1", schemaVersion: 1 as const, creatorType: "HUMAN" as const, creatorId: "0xabc",
  creatorWallet: "0xabc0000000000000000000000000000000000123" as `0x${string}`,
  marketId: "market-1", marketIdHash: `0x${"1".repeat(64)}` as `0x${string}`,
  initialDirection: "DOWN" as const, initialConfidenceBps: 5400, initialJudgmentAt: 900,
  direction: "UP" as const, confidenceBps: 7200, thesis: "Demand is holding above open.",
  counterCase: "Risk assets can reverse.", invalidationCondition: "Break below open.",
  createdAt: 1000, locksAt: 2000, revision: 1, previousReceiptHash: null,
  canonicalHash: `0x${"2".repeat(64)}` as `0x${string}`, authorizationType: "EIP712" as const,
  authorizationValue: "0xsig", proofState: "SIGNED" as const,
}

describe("forecast store", () => {
  it("persists and finds a receipt by hash", () => {
    const store = createForecastStore(":memory:")
    store.createReceipt(receipt)
    expect(store.getByHash(receipt.canonicalHash)).toMatchObject({ thesis: receipt.thesis, initialDirection: "DOWN", initialConfidenceBps: 5400 })
    store.close()
  })

  it("rejects duplicate canonical hashes", () => {
    const store = createForecastStore(":memory:")
    store.createReceipt(receipt)
    expect(() => store.createReceipt({ ...receipt, id: "receipt-2" })).toThrow()
    store.close()
  })

  it("records anchor and resolution without rewriting content", () => {
    const store = createForecastStore(":memory:")
    store.createReceipt(receipt)
    store.markAnchored(receipt.canonicalHash, { transactionHash: `0x${"3".repeat(64)}`, block: 42n, anchoredAt: 1500, late: false })
    store.resolve(receipt.canonicalHash, "UP", "SETTLED", 2100, 0.0784)
    expect(store.getByHash(receipt.canonicalHash)).toMatchObject({ proofState: "RESOLVED", anchorBlock: 42, outcome: "UP", brierScore: 0.0784 })
    store.close()
  })
})
