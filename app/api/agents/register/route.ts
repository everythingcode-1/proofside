import { randomUUID } from "node:crypto"
import { isAddress } from "viem"

import { createAgentKey, hashAgentKey } from "../../../../lib/agent-auth"
import { apiError, publicAgent, readJson, verifyOwnerChallenge } from "../../../../lib/agent-api"
import { getAgentStore, type AgentPolicy } from "../../../../lib/agent-store"

function validPolicy(value: unknown): value is AgentPolicy {
  if (!value || typeof value !== "object") return false
  const policy = value as Record<string, unknown>
  const assets = policy.assets
  const confidence = policy.minimumConfidence
  return Array.isArray(assets) && assets.length > 0 && assets.every((asset) => asset === "BTC" || asset === "ETH") &&
    typeof policy.allowRevisions === "boolean" &&
    (confidence === undefined || (Number.isInteger(confidence) && Number(confidence) >= 0 && Number(confidence) <= 100))
}

export async function POST(request: Request) {
  const body = await readJson(request)
  if (!body) return apiError("INVALID_BODY", "A JSON body is required.", 400)
  const wallet = typeof body.wallet === "string" ? body.wallet : ""
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const framework = typeof body.framework === "string" ? body.framework.trim() : ""
  if (!isAddress(wallet)) return apiError("INVALID_ADDRESS", "A valid EVM wallet address is required.", 400)
  if (name.length < 2 || name.length > 48 || description.length > 280 || framework.length < 1 || framework.length > 32 || !validPolicy(body.policy)) {
    return apiError("VALIDATION_FAILED", "Agent profile or policy is invalid.", 400)
  }
  if (typeof body.nonce !== "string" || typeof body.expiresAt !== "number" || typeof body.signature !== "string") {
    return apiError("VALIDATION_FAILED", "Challenge proof is incomplete.", 400)
  }
  const proofError = await verifyOwnerChallenge({
    wallet: wallet.toLowerCase() as `0x${string}`,
    purpose: "REGISTER",
    nonce: body.nonce,
    expiresAt: body.expiresAt,
    signature: body.signature as `0x${string}`,
  })
  if (proofError) return proofError

  const store = getAgentStore()
  const agent = store.createAgent({ id: randomUUID(), ownerWallet: wallet, name, description, framework, policy: body.policy })
  const apiKey = createAgentKey()
  store.saveKey({ agentId: agent.id, keyHash: hashAgentKey(apiKey), keyPrefix: apiKey.slice(0, 17) })
  return Response.json({ agent: publicAgent(agent), apiKey }, { status: 201 })
}
