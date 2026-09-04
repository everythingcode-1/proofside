import { currentMarket } from "./dreamdex"

const REVALIDATE_AFTER_MS = 2_000
const MAX_STALE_MS = 30_000

export type MarketSnapshot = {
  market: Awaited<ReturnType<typeof currentMarket>>
  fetchedAt: number
  expiresAt: number
}

let snapshot: MarketSnapshot | null = null
let refreshInFlight: Promise<MarketSnapshot> | null = null

async function refreshSnapshot() {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = currentMarket().then((market) => {
    const fetchedAt = Date.now()
    snapshot = { market, fetchedAt, expiresAt: fetchedAt + REVALIDATE_AFTER_MS }
    return snapshot
  }).finally(() => { refreshInFlight = null })
  return refreshInFlight
}

export async function getMarketSnapshot(now = Date.now()) {
  const cached = snapshot
  const current = !cached || now - cached.fetchedAt > MAX_STALE_MS ? await refreshSnapshot() : cached
  if (cached && current === cached && now >= cached.expiresAt && !refreshInFlight) void refreshSnapshot().catch(() => undefined)
  return { ...current, source: current === cached ? "cache" as const : "dreamdex" as const }
}

export async function loadSnapshotMarket() {
  return (await getMarketSnapshot()).market
}
