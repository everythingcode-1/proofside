export type FreshnessState = "LIVE" | "POLLING" | "RECONNECTING" | "STALE" | "OFFLINE"

export function freshnessState(input: {
  connected: boolean
  retrying: boolean
  hasSnapshot: boolean
  lastVerifiedAt: number | null
  now?: number
}): FreshnessState {
  const now = input.now ?? Date.now()
  if (!input.hasSnapshot || input.lastVerifiedAt === null) return "OFFLINE"
  if (now - input.lastVerifiedAt > 20_000) return "STALE"
  if (input.connected) return "LIVE"
  return "POLLING"
}

export const reconnectDelay = (attempt: number) => Math.min(15_000, 1_000 * 2 ** Math.max(0, attempt))
