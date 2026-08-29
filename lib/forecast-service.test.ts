import { describe, expect, it, vi } from "vitest"
import { createForecastService } from "./forecast-service"
import { createForecastStore } from "./forecast-store"

const market = { id: "market-1", locksAt: 2000, isLive: true, phase: "LIVE" as const }
const request = {
  creatorType: "HUMAN" as const, creatorId: "0xabc0000000000000000000000000000000000123",
  creatorWallet: "0xabc0000000000000000000000000000000000123" as `0x${string}`,
  marketId: "market-1", direction: "UP" as const, confidenceBps: 7200,
  thesis: "Demand remains above the opening print.", counterCase: "Risk-off pressure can reverse it.",
  invalidationCondition: "Price breaks below the open.", authorizationType: "EIP712" as const, authorizationValue: "0xsig",
}

describe("forecast service", () => {
  it("rejects a locked market", async () => {
    const store = createForecastStore(":memory:")
    const service = createForecastService({ store, loadMarket: async () => ({ ...market, isLive: false }), now: () => 1000, verifyHuman: async () => true, anchor: vi.fn() })
    await expect(service.publish(request)).rejects.toThrow("MARKET_LOCKED")
    store.close()
  })

  it("rejects a signer mismatch", async () => {
    const store = createForecastStore(":memory:")
    const service = createForecastService({ store, loadMarket: async () => market, now: () => 1000, verifyHuman: async () => false, anchor: vi.fn() })
    await expect(service.publish(request)).rejects.toThrow("SIGNATURE_INVALID")
    store.close()
  })

  it("stores an anchored receipt and is idempotent", async () => {
    const store = createForecastStore(":memory:")
    const anchor = vi.fn().mockResolvedValue({ transactionHash: `0x${"3".repeat(64)}`, block: 42n, anchoredAt: 1500 })
    const service = createForecastService({ store, loadMarket: async () => market, now: () => 1000, verifyHuman: async () => true, anchor })
    const first = await service.publish(request)
    const second = await service.publish(request)
    expect(first.proofState).toBe("ANCHORED")
    expect(second.canonicalHash).toBe(first.canonicalHash)
    expect(anchor).toHaveBeenCalledOnce()
    store.close()
  })

  it("keeps a signed receipt when anchoring is unavailable", async () => {
    const store = createForecastStore(":memory:")
    const service = createForecastService({ store, loadMarket: async () => market, now: () => 1000, verifyHuman: async () => true, anchor: vi.fn().mockRejectedValue(new Error("REGISTRY_NOT_CONFIGURED")) })
    expect((await service.publish(request)).proofState).toBe("SIGNED")
    store.close()
  })
})
