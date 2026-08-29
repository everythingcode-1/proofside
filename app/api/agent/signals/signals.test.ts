import { afterEach, describe, expect, it } from "vitest"

import { createAgentKey, hashAgentKey } from "../../../../lib/agent-auth"
import { setAgentMarketLoaderForTests } from "../../../../lib/agent-market"
import { createAgentStore, setAgentStoreForTests } from "../../../../lib/agent-store"
import { PUT } from "./[marketId]/route"

const market = {
  id: "0xmarket", symbol: "ETH", asset: "ETH" as const, question: "ETH up?", durationSec: 3600,
  strike: "Opening price", upPrice: 0.6, downPrice: 0.4, opensAt: 1, locksAt: 9_999_999_999,
  phase: "LIVE" as const, outcome: null, contractAddress: "0x0000000000000000000000000000000000000001" as const,
  yesSymbol: "ETH/YES", noSymbol: "ETH/NO", statusCode: 1, isLive: true,
}

describe("agent signals", () => {
  afterEach(() => { setAgentStoreForTests(); setAgentMarketLoaderForTests() })

  it("accepts an authenticated signal and appends a revision", async () => {
    const store = createAgentStore(":memory:")
    const raw = createAgentKey()
    store.createAgent({ id: "agent-1", ownerWallet: "0xabc", name: "Alpha", description: "", framework: "custom", policy: { assets: ["ETH"], allowRevisions: true } })
    store.saveKey({ agentId: "agent-1", keyHash: hashAgentKey(raw), keyPrefix: raw.slice(0, 17) })
    setAgentStoreForTests(store)
    setAgentMarketLoaderForTests(async () => market)

    const send = (direction: "UP" | "DOWN") => PUT(new Request("http://local/api/agent/signals/0xmarket", {
      method: "PUT", headers: { authorization: `Bearer ${raw}` }, body: JSON.stringify({ direction, confidence: 75, reason: "Momentum" }),
    }), { params: Promise.resolve({ marketId: "0xmarket" }) })
    const first = await send("UP")
    const accepted = await first.json()
    expect(first.status).toBe(201)
    expect(accepted.tradeUrl).toContain("direction=UP")
    expect(accepted.tradeUrl).toContain("agent=agent-1")
    expect((await send("DOWN")).status).toBe(201)
    expect(store.getPredictionHistory("0xmarket", "AGENT", "agent-1")).toHaveLength(2)
    store.close()
  })

  it("enforces an agent's asset policy", async () => {
    const store = createAgentStore(":memory:")
    const raw = createAgentKey()
    store.createAgent({ id: "agent-2", ownerWallet: "0xabc", name: "BTC Only", description: "", framework: "custom", policy: { assets: ["BTC"], allowRevisions: false } })
    store.saveKey({ agentId: "agent-2", keyHash: hashAgentKey(raw), keyPrefix: raw.slice(0, 17) })
    setAgentStoreForTests(store); setAgentMarketLoaderForTests(async () => market)
    const response = await PUT(new Request("http://local", { method: "PUT", headers: { authorization: `Bearer ${raw}` }, body: JSON.stringify({ direction: "UP" }) }), { params: Promise.resolve({ marketId: "0xmarket" }) })
    expect(response.status).toBe(403)
    expect((await response.json()).error.code).toBe("POLICY_REJECTED")
    store.close()
  })
})
