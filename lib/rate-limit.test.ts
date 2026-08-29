import { describe, expect, it } from "vitest"
import { createRateLimiter } from "./rate-limit"

describe("rate limiter", () => {
  it("limits a key and resets after the window", () => {
    const check = createRateLimiter(2, 1_000)
    expect(check("ip", 0).allowed).toBe(true)
    expect(check("ip", 1).allowed).toBe(true)
    expect(check("ip", 2).allowed).toBe(false)
    expect(check("ip", 1_001).allowed).toBe(true)
  })
})
