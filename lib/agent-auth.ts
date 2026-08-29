import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"

export type ChallengePurpose = "REGISTER" | "ROTATE_KEY" | "REVOKE"

export function challengeMessage(input: {
  wallet: string
  purpose: ChallengePurpose
  nonce: string
  expiresAt: number
}) {
  return [
    "DreamPulse Agent Protocol",
    "Domain: DreamPulse",
    "Chain ID: 50312",
    `Wallet: ${input.wallet.toLowerCase()}`,
    `Purpose: ${input.purpose}`,
    `Nonce: ${input.nonce}`,
    `Expires At: ${input.expiresAt}`,
  ].join("\n")
}

export function createAgentKey() {
  return `dp_agent_${randomBytes(32).toString("base64url")}`
}

export function hashAgentKey(key: string) {
  return createHash("sha256").update(key).digest("hex")
}

export function matchesAgentKey(candidate: string, expectedHash: string) {
  if (!/^[a-f0-9]{64}$/i.test(expectedHash)) return false

  const actual = Buffer.from(hashAgentKey(candidate), "hex")
  const expected = Buffer.from(expectedHash, "hex")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
