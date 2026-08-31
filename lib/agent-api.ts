import { verifyMessage } from "viem"

import { challengeMessage, hashAgentKey, type ChallengePurpose } from "./agent-auth"
import { getAgentStore, type AgentRecord } from "./agent-store"

export const apiError = (code: string, message: string, status: number, retryable = false) =>
  Response.json({ error: { code, message, retryable } }, { status })

export async function readJson(request: Request) {
  try {
    return await request.json() as Record<string, unknown>
  } catch {
    return null
  }
}

export async function verifyOwnerChallenge(input: {
  wallet: `0x${string}`
  purpose: ChallengePurpose
  nonce: string
  expiresAt: number
  signature: `0x${string}`
}) {
  const valid = await verifyMessage({
    address: input.wallet,
    message: challengeMessage(input),
    signature: input.signature,
  }).catch(() => false)
  if (!valid) return apiError("SIGNATURE_INVALID", "Wallet signature is invalid.", 401)
  if (!getAgentStore().consumeChallenge(input.nonce, input.wallet, input.purpose, Date.now(), input.expiresAt)) {
    return apiError("CHALLENGE_EXPIRED", "Challenge expired or was already used.", 401)
  }
  return null
}

export function publicAgent(agent: AgentRecord) {
  return {
    id: agent.id,
    ownerWallet: agent.ownerWallet,
    name: agent.name,
    description: agent.description,
    framework: agent.framework,
    policy: agent.policy,
    policyVersion: agent.policyVersion,
    status: agent.status,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  }
}

export function authenticateAgent(request: Request) {
  const authorization = request.headers.get("authorization")
  const raw = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : ""
  if (!raw.startsWith("ps_agent_") && !raw.startsWith("dp_agent_")) return { error: apiError("INVALID_API_KEY", "A valid agent Bearer key is required.", 401) }
  const match = getAgentStore().findAgentByKeyHash(hashAgentKey(raw))
  if (!match) return { error: apiError("INVALID_API_KEY", "A valid agent Bearer key is required.", 401) }
  if (match.agent.status === "REVOKED" || match.keyRevoked) {
    return { error: apiError("AGENT_REVOKED", "This agent credential has been revoked.", 401) }
  }
  getAgentStore().touchKey(match.keyId)
  return { agent: match.agent }
}
