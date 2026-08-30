import { describe, expect, it } from "vitest"
import { marketRefreshDelay } from "./live-refresh"

describe("market refresh cadence", () => {
  it("polls economically while a market has time remaining", () => {
    expect(marketRefreshDelay(200, 100_000)).toBe(10_000)
  })

  it("prefetches every second during the rollover window", () => {
    expect(marketRefreshDelay(114, 100_000)).toBe(1_000)
    expect(marketRefreshDelay(100, 100_000)).toBe(1_000)
    expect(marketRefreshDelay(95, 100_000)).toBe(1_000)
  })

  it("schedules the first prefetch exactly at the rollover boundary", () => {
    expect(marketRefreshDelay(120, 100_000)).toBe(5_000)
  })
})
