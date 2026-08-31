import { describe, expect, it } from "vitest"

import {
  challengeMessage,
  createAgentKey,
  hashAgentKey,
  matchesAgentKey,
} from "./agent-auth"

describe("agent auth", () => {
  it("binds registration to Somnia, wallet, nonce, and expiry", () => {
    expect(
      challengeMessage({
        wallet: "0xAbC",
        purpose: "REGISTER",
        nonce: "n1",
        expiresAt: 123,
      }),
    ).toBe(
      [
        "Proofside Agent Protocol",
        "Domain: Proofside",
        "Chain ID: 50312",
        "Wallet: 0xabc",
        "Purpose: REGISTER",
        "Nonce: n1",
        "Expires At: 123",
      ].join("\n"),
    )
  })

  it("stores only a verifiable key hash", () => {
    const raw = createAgentKey()
    const hash = hashAgentKey(raw)

    expect(raw.startsWith("ps_agent_")).toBe(true)
    expect(raw).not.toBe(hash)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(matchesAgentKey(raw, hash)).toBe(true)
    expect(matchesAgentKey(`${raw}x`, hash)).toBe(false)
    expect(matchesAgentKey(raw, "bad-hash")).toBe(false)
  })
})
