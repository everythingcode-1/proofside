import { loadAgentMarket } from "@/lib/agent-market"
import { buildForecastPayload, hashForecastPayload, validateForecastInput } from "@/lib/forecast-receipt"
import { getForecastStore } from "@/lib/forecast-store"
import { forecastTypedData } from "@/lib/forecast-service"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.creatorWallet) return Response.json({ code: "VALIDATION_FAILED", message: "Wallet and forecast fields are required." }, { status: 400 })
  const market = await loadAgentMarket().catch(() => null)
  if (!market) return Response.json({ code: "DREAMDEX_UNAVAILABLE", message: "DreamDEX market is unavailable.", retryable: true }, { status: 503 })
  const createdAt = Date.now(), locksAt = market.locksAt * 1000
  if (body.marketId?.toLowerCase() !== market.id.toLowerCase() || !market.isLive || createdAt >= locksAt) return Response.json({ code: "MARKET_LOCKED", message: "The market is not open." }, { status: 409 })
  const history = getForecastStore().listForMarket(market.id).filter((row) => row.creatorType === "HUMAN" && row.creatorId === body.creatorWallet.toLowerCase())
  const previous = history[0]
  const input = {
    ...body,
    initialDirection: body.initialDirection ?? body.direction,
    initialConfidenceBps: body.initialConfidenceBps ?? body.confidenceBps,
    initialJudgmentAt: body.initialJudgmentAt ?? createdAt,
    creatorType: "HUMAN" as const, creatorId: body.creatorWallet, createdAt, locksAt,
    revision: previous ? previous.revision + 1 : 1, previousReceiptHash: previous?.canonicalHash ?? null,
  }
  const errors = validateForecastInput(input)
  if (errors.length) return Response.json({ code: "VALIDATION_FAILED", message: errors.join(", ") }, { status: 400 })
  const payload = buildForecastPayload(input)
  const canonicalHash = hashForecastPayload(payload)
  const typedData = forecastTypedData(canonicalHash, payload.marketId, locksAt)
  return Response.json({ payload, canonicalHash, typedData: { ...typedData, message: { ...typedData.message, locksAt: String(typedData.message.locksAt) } } })
}
