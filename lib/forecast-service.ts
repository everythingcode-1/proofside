import { randomUUID } from "node:crypto"
import { verifyTypedData } from "viem"
import { anchorForecast } from "./forecast-registry"
import { buildForecastPayload, hashForecastPayload, validateForecastInput, type CreatorType } from "./forecast-receipt"
import { getForecastStore, type ForecastStore } from "./forecast-store"
import { loadAgentMarket } from "./agent-market"
import type { Direction } from "./types"

export type PublishForecastRequest = {
  creatorType: CreatorType; creatorId: string; creatorWallet: `0x${string}`; marketId: string
  direction: Direction; confidenceBps: number; thesis: string; counterCase: string; invalidationCondition: string
  authorizationType: "EIP712" | "AGENT_API"; authorizationValue: string; backingTransactionHash?: `0x${string}`; createdAt?: number
}
type MarketAuthority = { id: string; locksAt: number; isLive: boolean; phase: string }
type Dependencies = {
  store?: ForecastStore; loadMarket?: () => Promise<MarketAuthority>; now?: () => number
  verifyHuman?: (input: { wallet: `0x${string}`; canonicalHash: `0x${string}`; marketId: string; locksAt: number; signature: string }) => Promise<boolean>
  anchor?: typeof anchorForecast
}

export const forecastTypedData = (canonicalHash: `0x${string}`, marketId: string, locksAt: number) => ({
  domain: { name: "DreamPulse", version: "1", chainId: 50312 },
  types: { ForecastReceipt: [{ name: "canonicalHash", type: "bytes32" }, { name: "marketId", type: "string" }, { name: "locksAt", type: "uint256" }] },
  primaryType: "ForecastReceipt" as const,
  message: { canonicalHash, marketId, locksAt: BigInt(locksAt) },
})

async function defaultVerifyHuman(input: { wallet: `0x${string}`; canonicalHash: `0x${string}`; marketId: string; locksAt: number; signature: string }) {
  return verifyTypedData({ address: input.wallet, ...forecastTypedData(input.canonicalHash, input.marketId, input.locksAt), signature: input.signature as `0x${string}` })
}

export function createForecastService(dependencies: Dependencies = {}) {
  const store = dependencies.store ?? getForecastStore()
  const now = dependencies.now ?? Date.now
  return {
    async publish(request: PublishForecastRequest) {
      const market = await (dependencies.loadMarket ?? loadAgentMarket)()
      const locksAt = market.locksAt < 1e12 ? market.locksAt * 1000 : market.locksAt
      const serverNow = now()
      const createdAt = request.createdAt ?? serverNow
      if (market.id.toLowerCase() !== request.marketId.toLowerCase()) throw new Error("MARKET_NOT_FOUND")
      if (!market.isLive || market.phase !== "LIVE" || createdAt >= locksAt || createdAt > serverNow + 5_000 || serverNow - createdAt > 300_000) throw new Error("MARKET_LOCKED")
      const history = store.listForMarket(market.id).filter((row) => row.creatorType === request.creatorType && row.creatorId === request.creatorId.toLowerCase())
      const previous = history[0] ?? null
      if (previous && previous.direction === request.direction && previous.confidenceBps === request.confidenceBps && previous.thesis === request.thesis.trim() && previous.counterCase === request.counterCase.trim() && previous.invalidationCondition === request.invalidationCondition.trim()) return previous
      const input = { ...request, createdAt, locksAt, revision: previous ? previous.revision + 1 : 1, previousReceiptHash: previous?.canonicalHash ?? null }
      const errors = validateForecastInput(input)
      if (errors.length) throw new Error(`VALIDATION_FAILED:${errors.join(",")}`)
      const payload = buildForecastPayload(input)
      const canonicalHash = hashForecastPayload(payload)
      const existing = store.getByHash(canonicalHash)
      if (existing) return existing
      if (request.creatorType === "HUMAN") {
        const valid = await (dependencies.verifyHuman ?? defaultVerifyHuman)({ wallet: request.creatorWallet, canonicalHash, marketId: payload.marketId, locksAt, signature: request.authorizationValue })
        if (!valid || request.creatorId.toLowerCase() !== request.creatorWallet.toLowerCase()) throw new Error("SIGNATURE_INVALID")
      }
      store.createReceipt({ ...payload, id: randomUUID(), canonicalHash, authorizationType: request.authorizationType, authorizationValue: request.authorizationValue, proofState: "SIGNED", backingTxHash: request.backingTransactionHash })
      try {
        store.markAnchoring(canonicalHash)
        const proof = await (dependencies.anchor ?? anchorForecast)({ receiptHash: canonicalHash, creator: payload.creatorWallet, marketIdHash: payload.marketIdHash, previousReceiptHash: payload.previousReceiptHash })
        store.markAnchored(canonicalHash, { ...proof, late: proof.anchoredAt >= locksAt })
      } catch {
        store.markAnchorFailed(canonicalHash)
      }
      return store.getByHash(canonicalHash)!
    },
  }
}

export const getForecastService = () => createForecastService()
