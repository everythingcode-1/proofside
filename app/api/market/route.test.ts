import { beforeEach, describe, expect, it, vi } from "vitest"

const currentMarket = vi.fn()
vi.mock("@/lib/dreamdex", () => ({ currentMarket }))
vi.mock("../../../lib/dreamdex", () => ({ currentMarket }))
vi.mock("@/lib/room-store", () => ({ getTransitions: vi.fn(() => []), recordTransition: vi.fn() }))
vi.mock("@/lib/forecast-store", () => ({ getForecastStore: vi.fn(() => ({})) }))
vi.mock("@/lib/forecast-settlement", () => ({ reconcileForecastReceipts: vi.fn() }))

const market = {
  id: "0xmarket",
  symbol: "BTC-TEST",
  asset: "BTC",
  question: "BTC closes above opening",
  durationSec: 300,
  strike: "Opening price",
  upPrice: 0.6,
  downPrice: 0.4,
  opensAt: 100,
  locksAt: 400,
  phase: "LIVE",
  outcome: null,
  contractAddress: "0x0000000000000000000000000000000000000001",
  yesSymbol: "BTC#YES",
  noSymbol: "BTC#NO",
  statusCode: 1,
  isLive: true,
}

describe("GET /api/market", () => {
  beforeEach(() => {
    vi.resetModules()
    currentMarket.mockReset().mockResolvedValue(market)
  })

  it("serves repeated reads from a warm snapshot instead of reopening DreamDEX", async () => {
    const { GET } = await import("./route")
    const { loadAgentMarket } = await import("../../../lib/agent-market")

    const first = await GET()
    const second = await GET()
    const agentMarket = await loadAgentMarket()

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(currentMarket).toHaveBeenCalledTimes(1)
    expect(agentMarket).toEqual(market)
    await expect(second.json()).resolves.toMatchObject({ market, source: "cache" })
  })

  it("refuses an expired snapshot when DreamDEX cannot refresh it", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"))
    const { GET } = await import("./route")
    expect((await GET()).status).toBe(200)
    currentMarket.mockRejectedValueOnce(new Error("DreamDEX unavailable"))
    vi.advanceTimersByTime(31_000)

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ error: "DreamDEX unavailable" })
    vi.useRealTimers()
  })
})
