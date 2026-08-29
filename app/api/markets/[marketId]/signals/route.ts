import { loadAgentMarket } from "../../../../../lib/agent-market"
import { getAgentStore } from "../../../../../lib/agent-store"

type Context = { params: Promise<{ marketId: string }> }

export async function GET(_: Request, context: Context) {
  const { marketId } = await context.params
  const market = await loadAgentMarket().catch(() => null)
  const before = market?.id.toLowerCase() === marketId.toLowerCase() ? market.locksAt * 1_000 : Date.now()
  return Response.json({ marketId, signals: getAgentStore().listActiveAgentSignals(marketId, before) }, { headers: { "Cache-Control": "no-store" } })
}
