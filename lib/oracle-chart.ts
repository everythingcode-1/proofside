import type { PriceCandle } from "@somnia-chain/markets-sdk"
import type { MarketView } from "./types"

export type OracleChartPoint = { time: number; open: number; high: number; low: number; close: number }
export type OracleChartView = {
  marketId: string; asset: "BTC" | "ETH"; quote: "USDC"; resolution: "M1"
  opensAt: number; locksAt: number; openingPrice: number | null; currentPrice: number | null
  change: number | null; changePercent: number | null; updatedAt: number | null
  freshness: "LIVE" | "STALE" | "EMPTY"; points: OracleChartPoint[]
}

export function mergeOracleChartPoints(previous: OracleChartPoint[], incoming: OracleChartPoint[]) {
  const points = new Map(previous.map((point) => [point.time, point]))
  for (const point of incoming) points.set(point.time, point)
  return [...points.values()].sort((a, b) => a.time - b.time).slice(-240)
}

export function buildOracleChartView(
  market: Pick<MarketView, "id" | "asset" | "opensAt" | "locksAt" | "strike">,
  candles: PriceCandle[],
  now = Date.now(),
): OracleChartView {
  const points = candles.map(({ bucketStart: time, open, high, low, close }) => ({ time, open, high, low, close }))
    .filter((point) => Object.values(point).every(Number.isFinite))
    .sort((a, b) => a.time - b.time).slice(-240)
  const numericStrike = Number(market.strike)
  const candleOpen = points.find((point) => point.time >= market.opensAt)?.open ?? null
  const openingPrice = Number.isFinite(numericStrike) && numericStrike > 0 ? numericStrike : candleOpen
  const currentPrice = points.at(-1)?.close ?? null
  const change = openingPrice !== null && currentPrice !== null ? currentPrice - openingPrice : null
  const updatedAt = points.length ? points.at(-1)!.time * 1000 : null
  return {
    marketId: market.id, asset: market.asset, quote: "USDC", resolution: "M1", opensAt: market.opensAt,
    locksAt: market.locksAt, openingPrice, currentPrice, change,
    changePercent: change === null || openingPrice === null ? null : change / openingPrice * 100,
    updatedAt, freshness: updatedAt === null ? "EMPTY" : now - updatedAt <= 120_000 ? "LIVE" : "STALE", points,
  }
}
