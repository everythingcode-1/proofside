import { apiError, authenticateAgent, readJson } from "../../../../../lib/agent-api"
import { loadAgentMarket } from "../../../../../lib/agent-market"
import { getAgentStore } from "../../../../../lib/agent-store"

type Context = { params: Promise<{ marketId: string }> }

export async function PUT(request: Request, context: Context) {
  const auth = authenticateAgent(request)
  if (auth.error) return auth.error
  const size = Number(request.headers.get("content-length") || 0)
  if (size > 2_048) return apiError("BODY_TOO_LARGE", "Signal body exceeds 2 KB.", 413)
  const body = await readJson(request)
  const direction = body?.direction
  const confidence = body?.confidence === undefined ? null : body.confidence
  const reason = typeof body?.reason === "string" ? body.reason.trim() : ""
  if ((direction !== "UP" && direction !== "DOWN") || (confidence !== null && (!Number.isInteger(confidence) || Number(confidence) < 0 || Number(confidence) > 100)) || reason.length > 280) {
    return apiError("VALIDATION_FAILED", "Direction, confidence, or reason is invalid.", 400)
  }
  const { marketId } = await context.params
  let market
  try { market = await loadAgentMarket() } catch { return apiError("DREAMDEX_UNAVAILABLE", "DreamDEX live market is temporarily unavailable.", 503, true) }
  if (market.id.toLowerCase() !== marketId.toLowerCase()) return apiError("MARKET_NOT_FOUND", "This is not the current DreamDEX market.", 404)
  if (!market.isLive || market.phase !== "LIVE" || Date.now() >= market.locksAt * 1_000) return apiError("MARKET_LOCKED", "This market no longer accepts signals.", 409)
  if (!auth.agent.policy.assets.includes(market.asset)) return apiError("POLICY_REJECTED", "This asset is outside the agent policy.", 403)
  if (confidence !== null && auth.agent.policy.minimumConfidence !== undefined && Number(confidence) < auth.agent.policy.minimumConfidence) {
    return apiError("POLICY_REJECTED", "Confidence is below the agent policy minimum.", 403)
  }
  const store = getAgentStore()
  const history = store.getPredictionHistory(market.id, "AGENT", auth.agent.id)
  if (history.length && !auth.agent.policy.allowRevisions) return apiError("REVISION_DISABLED", "This agent policy does not allow revisions.", 409)
  const signal = store.appendPrediction({ marketId: market.id, actorType: "AGENT", actorId: auth.agent.id, direction, confidence: confidence === null ? null : Number(confidence), reason, createdAt: Date.now() })
  const tradeUrl = `/?${new URLSearchParams({ market: market.id, direction, agent: auth.agent.id, signal: signal.id })}`
  return Response.json({ signalId: signal.id, accepted: true, marketLocksAt: market.locksAt, tradeUrl }, { status: 201 })
}

export async function GET(request: Request, context: Context) {
  const auth = authenticateAgent(request)
  if (auth.error) return auth.error
  const { marketId } = await context.params
  const history = getAgentStore().getPredictionHistory(marketId, "AGENT", auth.agent.id)
  return Response.json({ signal: history.at(-1) ?? null, history })
}
