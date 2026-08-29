import { describe, expect, it } from "vitest"
import { freshnessState, reconnectDelay } from "./realtime"

describe("real-time freshness", () => {
  it("classifies connection and snapshot age", () => {
    const base = { hasSnapshot: true, lastVerifiedAt: 95_000, now: 100_000 }
    expect(freshnessState({ ...base, connected: true, retrying: false })).toBe("LIVE")
    expect(freshnessState({ ...base, connected: false, retrying: true })).toBe("RECONNECTING")
    expect(freshnessState({ ...base, connected: false, retrying: false })).toBe("POLLING")
    expect(freshnessState({ ...base, connected: true, retrying: false, lastVerifiedAt: 70_000 })).toBe("STALE")
    expect(freshnessState({ ...base, connected: false, retrying: false, hasSnapshot: false })).toBe("OFFLINE")
  })

  it("caps reconnect backoff", () => {
    expect([0, 1, 2, 3, 4, 9].map(reconnectDelay)).toEqual([1_000, 2_000, 4_000, 8_000, 15_000, 15_000])
  })
})
