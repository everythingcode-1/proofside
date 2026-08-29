import { keccak256, toBytes } from "viem"
import type { Direction } from "./types"

export type CreatorType = "HUMAN" | "AGENT"
export type ForecastProofState = "SIGNED" | "ANCHORING" | "ANCHORED" | "LATE" | "RESOLVED" | "VOID"
export type ForecastInput = {
  creatorType: CreatorType
  creatorId: string
  creatorWallet: `0x${string}`
  marketId: string
  direction: Direction
  confidenceBps: number
  thesis: string
  counterCase: string
  invalidationCondition: string
  createdAt: number
  locksAt: number
  revision: number
  previousReceiptHash: `0x${string}` | null
}
export type ForecastPayload = ForecastInput & { schemaVersion: 1; marketIdHash: `0x${string}` }

export function validateForecastInput(input: ForecastInput) {
  const errors: string[] = []
  if (!Number.isInteger(input.confidenceBps) || input.confidenceBps < 100 || input.confidenceBps > 9900) errors.push("Confidence")
  if (!input.thesis.trim() || input.thesis.length > 560) errors.push("Thesis")
  if (!input.counterCase.trim() || input.counterCase.length > 280) errors.push("Counter-case")
  if (!input.invalidationCondition.trim() || input.invalidationCondition.length > 280) errors.push("Invalidation condition")
  if (!Number.isInteger(input.revision) || input.revision < 1 || (input.revision === 1) !== (input.previousReceiptHash === null)) errors.push("Revision")
  if (input.createdAt >= input.locksAt) errors.push("Market lock")
  return errors
}

export function buildForecastPayload(input: ForecastInput): ForecastPayload {
  return {
    ...input,
    schemaVersion: 1,
    creatorId: input.creatorId.toLowerCase(),
    creatorWallet: input.creatorWallet.toLowerCase() as `0x${string}`,
    marketId: input.marketId.toLowerCase(),
    marketIdHash: keccak256(toBytes(input.marketId.toLowerCase())),
    thesis: input.thesis.trim().replace(/\r\n/g, "\n"),
    counterCase: input.counterCase.trim().replace(/\r\n/g, "\n"),
    invalidationCondition: input.invalidationCondition.trim().replace(/\r\n/g, "\n"),
  }
}

export function canonicalForecastJson(payload: ForecastPayload) {
  return JSON.stringify([
    payload.schemaVersion, payload.creatorType, payload.creatorId, payload.creatorWallet,
    payload.marketId, payload.marketIdHash, payload.direction, payload.confidenceBps,
    payload.thesis, payload.counterCase, payload.invalidationCondition, payload.createdAt,
    payload.locksAt, payload.revision, payload.previousReceiptHash,
  ])
}

export function hashForecastPayload(payload: ForecastPayload) {
  return keccak256(toBytes(canonicalForecastJson(payload)))
}
