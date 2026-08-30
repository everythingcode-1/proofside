export const NORMAL_MARKET_REFRESH_MS = 10_000
export const ROLLOVER_MARKET_REFRESH_MS = 1_000
export const ROLLOVER_PREFETCH_SECONDS = 15

export function marketRefreshDelay(locksAt: number | null, nowMs: number) {
  if (!locksAt) return NORMAL_MARKET_REFRESH_MS
  const secondsToLock = locksAt - nowMs / 1000
  return secondsToLock <= ROLLOVER_PREFETCH_SECONDS
    ? ROLLOVER_MARKET_REFRESH_MS
    : Math.min(NORMAL_MARKET_REFRESH_MS, Math.max(ROLLOVER_MARKET_REFRESH_MS, (secondsToLock - ROLLOVER_PREFETCH_SECONDS) * 1000))
}
