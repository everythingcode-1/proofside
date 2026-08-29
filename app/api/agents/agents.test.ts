import { privateKeyToAccount } from "viem/accounts"
import { afterEach, describe, expect, it } from "vitest"

import { createAgentStore, setAgentStoreForTests } from "../../../lib/agent-store"
import { POST as challenge } from "./challenge/route"
import { POST as register } from "./register/route"
import { POST as revoke } from "./revoke/route"

const account = privateKeyToAccount("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")

async function json(response: Response) {
  return response.json() as Promise<Record<string, any>>
}

describe("agent owner routes", () => {
  afterEach(() => setAgentStoreForTests())

  it("rejects an invalid wallet address", async () => {
    setAgentStoreForTests(createAgentStore(":memory:"))
    const response = await challenge(new Request("http://local/api/agents/challenge", {
      method: "POST",
      body: JSON.stringify({ wallet: "wrong", purpose: "REGISTER" }),
    }))
    expect(response.status).toBe(400)
    expect((await json(response)).error.code).toBe("INVALID_ADDRESS")
  })

  it("registers once, reveals the key once, and revokes it", async () => {
    const store = createAgentStore(":memory:")
    setAgentStoreForTests(store)
    const challengeResponse = await challenge(new Request("http://local/api/agents/challenge", {
      method: "POST",
      body: JSON.stringify({ wallet: account.address, purpose: "REGISTER" }),
    }))
    const issued = await json(challengeResponse)
    const signature = await account.signMessage({ message: issued.message })

    const registration = await register(new Request("http://local/api/agents/register", {
      method: "POST",
      body: JSON.stringify({
        wallet: account.address,
        nonce: issued.nonce,
        expiresAt: issued.expiresAt,
        signature,
        name: "Hermes Alpha",
        description: "BTC and ETH signal agent",
        framework: "hermes",
        policy: { assets: ["BTC", "ETH"], allowRevisions: true, minimumConfidence: 60 },
      }),
    }))
    const created = await json(registration)
    expect(registration.status).toBe(201)
    expect(created.apiKey).toMatch(/^dp_agent_/)
    expect(JSON.stringify(created.agent)).not.toContain("keyHash")

    const replay = await register(new Request("http://local/api/agents/register", {
      method: "POST",
      body: JSON.stringify({ ...created.agent, wallet: account.address, nonce: issued.nonce, expiresAt: issued.expiresAt, signature, policy: created.agent.policy }),
    }))
    expect(replay.status).toBe(401)
    expect((await json(replay)).error.code).toBe("CHALLENGE_EXPIRED")

    const revokeChallenge = await challenge(new Request("http://local/api/agents/challenge", {
      method: "POST",
      body: JSON.stringify({ wallet: account.address, purpose: "REVOKE" }),
    }))
    const revokeIssued = await json(revokeChallenge)
    const revokeSignature = await account.signMessage({ message: revokeIssued.message })
    const revoked = await revoke(new Request("http://local/api/agents/revoke", {
      method: "POST",
      body: JSON.stringify({ agentId: created.agent.id, wallet: account.address, nonce: revokeIssued.nonce, expiresAt: revokeIssued.expiresAt, signature: revokeSignature }),
    }))
    expect(revoked.status).toBe(200)
    expect((await json(revoked)).revoked).toBe(true)
    expect(store.findAgentByKeyHash((await import("../../../lib/agent-auth")).hashAgentKey(created.apiKey))?.agent.status).toBe("REVOKED")
    store.close()
  })
})
