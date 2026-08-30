import { describe, expect, it } from "vitest"
import { buildOracleChartView } from "./oracle-chart"

const market = { id: "m1", asset: "BTC" as const, opensAt: 1000, locksAt: 1600, strike: "Opening price" }
const candle = (bucketStart: number, open: number, close: number) => ({ asset: "BTC", resolution: "M1" as const, bucketStart, open, high: Math.max(open, close) + 1, low: Math.min(open, close) - 1, close, emaClose: close, count: 3 })

describe("oracle chart", () => {
  it("derives opening, current, and change from oracle candles", () => {
    const view = buildOracleChartView(market, [candle(1000, 100, 101), candle(1060, 101, 103)], 1_120_000)
    expect(view).toMatchObject({ asset: "BTC", quote: "USDC", openingPrice: 100, currentPrice: 103, change: 3, changePercent: 3, freshness: "LIVE" })
  })

  it("uses a numeric DreamDEX strike when present", () => {
    expect(buildOracleChartView({ ...market, asset: "ETH", strike: "2500" }, [candle(1000, 2490, 2510)], 1_060_000).openingPrice).toBe(2500)
  })

  it("filters invalid points and reports stale data", () => {
    const invalid = { ...candle(1060, 101, 103), close: Number.NaN }
    const view = buildOracleChartView(market, [candle(1000, 100, 101), invalid], 1_300_001)
    expect(view.points).toHaveLength(1)
    expect(view.freshness).toBe("STALE")
  })

  it("reports an empty feed honestly", () => {
    expect(buildOracleChartView(market, [], 1_100_000)).toMatchObject({ openingPrice: null, currentPrice: null, freshness: "EMPTY", points: [] })
  })

  it("keeps only the latest 240 sorted points", () => {
    const rows = Array.from({ length: 260 }, (_, index) => candle(1000 + (259 - index) * 60, 100, 101))
    const view = buildOracleChartView(market, rows, 20_000_000)
    expect(view.points).toHaveLength(240)
    expect(view.points[0].time).toBeLessThan(view.points.at(-1)!.time)
  })
})
