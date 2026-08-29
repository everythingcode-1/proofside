import type { FreshnessState } from "./realtime"
import type { TransactionState } from "./transactions"

export type PulseStage = "MARKET" | "SIGNATURE" | "SOMNIA" | "PROOF" | "ATTENTION"

export function pulseStage(freshness: FreshnessState, transaction: TransactionState): PulseStage {
  if (["BLOCKED", "CANCELLED", "REVERTED", "UNKNOWN"].includes(transaction) || ["STALE", "OFFLINE"].includes(freshness)) return "ATTENTION"
  if (transaction === "CONFIRMED") return "PROOF"
  if (transaction === "SUBMITTED") return "SOMNIA"
  if (transaction === "PREFLIGHT" || transaction === "AWAITING_SIGNATURE") return "SIGNATURE"
  return "MARKET"
}

export function speedLabel(elapsedMs: number | null) {
  if (elapsedMs === null || !Number.isFinite(elapsedMs)) return "Live verification"
  return `Verified in ${(Math.max(0, elapsedMs) / 1_000).toFixed(2)}s`
}
