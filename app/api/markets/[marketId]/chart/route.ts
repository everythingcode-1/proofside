import { loadAgentMarket } from "../../../../../lib/agent-market"
import { loadOracleChart } from "../../../../../lib/dreamdex"
import type { OracleChartView } from "../../../../../lib/oracle-chart"
import type { MarketView } from "../../../../../lib/types"

type Dependencies = { loadMarket: () => Promise<MarketView>; loadChart: (market: MarketView) => Promise<OracleChartView> }
const headers = { "Cache-Control": "no-store" }

export async function handleChartRequest(marketId: string, dependencies: Dependencies = { loadMarket: loadAgentMarket, loadChart: loadOracleChart }) {
  let market: MarketView
  try { market = await dependencies.loadMarket() } catch {
    return Response.json({ code: "DREAMDEX_UNAVAILABLE", message: "DreamDEX market is unavailable.", retryable: true }, { status: 503, headers })
  }
  if (market.id.toLowerCase() !== marketId.toLowerCase()) {
    return Response.json({ code: "MARKET_NOT_FOUND", message: "This is not the active DreamDEX market.", retryable: false }, { status: 404, headers })
  }
  try { return Response.json({ chart: await dependencies.loadChart(market) }, { headers }) } catch {
    return Response.json({ code: "ORACLE_UNAVAILABLE", message: "Somnia oracle candles are temporarily unavailable.", retryable: true }, { status: 503, headers })
  }
}

type Context = { params: Promise<{ marketId: string }> }
export async function GET(_request: Request, context: Context) { return handleChartRequest((await context.params).marketId) }
