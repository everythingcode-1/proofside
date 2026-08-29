import { apiError } from "../../../../../lib/agent-api"
import { loadAgentMarket } from "../../../../../lib/agent-market"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const market = await loadAgentMarket()
    return Response.json({
      market: {
        id: market.id, asset: market.asset, question: market.question, phase: market.phase,
        locksAt: market.locksAt, upPrice: market.upPrice, downPrice: market.downPrice,
        yesSymbol: market.yesSymbol, noSymbol: market.noSymbol,
      },
      serverTime: Date.now(),
    }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return apiError("DREAMDEX_UNAVAILABLE", "DreamDEX live market is temporarily unavailable.", 503, true)
  }
}
