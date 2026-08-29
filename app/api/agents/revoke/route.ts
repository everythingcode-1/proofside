import { isAddress } from "viem"

import { apiError, readJson, verifyOwnerChallenge } from "../../../../lib/agent-api"
import { getAgentStore } from "../../../../lib/agent-store"

export async function POST(request: Request) {
  const body = await readJson(request)
  const wallet = typeof body?.wallet === "string" ? body.wallet.toLowerCase() : ""
  const agentId = typeof body?.agentId === "string" ? body.agentId : ""
  if (!isAddress(wallet) || !agentId || typeof body?.nonce !== "string" || typeof body.expiresAt !== "number" || typeof body.signature !== "string") {
    return apiError("VALIDATION_FAILED", "Agent and wallet challenge proof are required.", 400)
  }
  const agent = getAgentStore().getAgent(agentId)
  if (!agent || agent.ownerWallet !== wallet) return apiError("AGENT_NOT_FOUND", "No owned agent was found.", 404)
  const proofError = await verifyOwnerChallenge({ wallet: wallet as `0x${string}`, purpose: "REVOKE", nonce: body.nonce, expiresAt: body.expiresAt, signature: body.signature as `0x${string}` })
  if (proofError) return proofError
  getAgentStore().revokeAgent(agentId)
  return Response.json({ revoked: true })
}
