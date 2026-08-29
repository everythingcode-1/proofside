import { randomBytes } from "node:crypto"
import { getAddress, isAddress } from "viem"

import { challengeMessage, type ChallengePurpose } from "../../../../lib/agent-auth"
import { apiError, readJson } from "../../../../lib/agent-api"
import { getAgentStore } from "../../../../lib/agent-store"

const purposes = new Set<ChallengePurpose>(["REGISTER", "ROTATE_KEY", "REVOKE"])

export async function POST(request: Request) {
  const body = await readJson(request)
  const wallet = typeof body?.wallet === "string" ? body.wallet : ""
  const requestedPurpose = typeof body?.purpose === "string" ? body.purpose : ""
  if (!isAddress(wallet)) return apiError("INVALID_ADDRESS", "A valid EVM wallet address is required.", 400)
  if (!purposes.has(requestedPurpose as ChallengePurpose)) return apiError("INVALID_PURPOSE", "Challenge purpose is invalid.", 400)
  const purpose = requestedPurpose as ChallengePurpose

  const normalized = getAddress(wallet).toLowerCase() as `0x${string}`
  const nonce = randomBytes(24).toString("base64url")
  const expiresAt = Date.now() + 5 * 60_000
  getAgentStore().saveChallenge({ nonce, wallet: normalized, purpose, expiresAt })
  return Response.json({ nonce, expiresAt, message: challengeMessage({ wallet: normalized, purpose, nonce, expiresAt }) })
}
