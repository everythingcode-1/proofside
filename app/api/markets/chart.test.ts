import { describe, expect, it, vi } from "vitest"
import { handleChartRequest } from "./[marketId]/chart/route"

const market = { id: "m1", asset: "BTC" as const, opensAt: 1000, locksAt: 1600, strike: "Opening price", isLive: true, phase: "LIVE" }
const chart = { marketId: "m1", asset: "BTC", quote: "USDC", resolution: "M1", points: [], freshness: "EMPTY" }

describe("market chart route", () => {
  it("returns chart data for the authoritative market", async () => {
    const response = await handleChartRequest("m1", { loadMarket: async () => market as never, loadChart: async () => chart as never })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ chart })
  })

  it("rejects a different market id", async () => {
    const response = await handleChartRequest("other", { loadMarket: async () => market as never, loadChart: vi.fn() })
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ code: "MARKET_NOT_FOUND" })
  })

  it("separates market and oracle outages", async () => {
    const marketFailure = await handleChartRequest("m1", { loadMarket: async () => { throw new Error("down") }, loadChart: vi.fn() })
    const oracleFailure = await handleChartRequest("m1", { loadMarket: async () => market as never, loadChart: async () => { throw new Error("down") } })
    expect(await marketFailure.json()).toMatchObject({ code: "DREAMDEX_UNAVAILABLE", retryable: true })
    expect(await oracleFailure.json()).toMatchObject({ code: "ORACLE_UNAVAILABLE", retryable: true })
  })
})
