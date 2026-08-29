import { scoreForecast } from "./calibration"
import type { ForecastStore } from "./forecast-store"
import type { Direction } from "./types"

export function reconcileForecastReceipts(store: ForecastStore, market: { id: string; phase: string; outcome: Direction | null }, resolvedAt = Date.now()) {
  if (market.phase !== "SETTLED" && market.phase !== "VOID") return 0
  const receipts = store.listForMarket(market.id).filter((receipt) => receipt.proofState === "ANCHORED")
  for (const receipt of receipts) {
    const isVoid = market.phase === "VOID" || !market.outcome
    store.resolve(receipt.canonicalHash, isVoid ? null : market.outcome, isVoid ? "VOID" : "SETTLED", resolvedAt,
      isVoid ? null : scoreForecast(receipt.direction, receipt.confidenceBps, market.outcome!))
  }
  return receipts.length
}
