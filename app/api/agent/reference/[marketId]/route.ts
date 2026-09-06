import { loadAgentMarket } from "@/lib/agent-market"
import { loadOracleChart } from "@/lib/dreamdex"
import { getForecastService } from "@/lib/forecast-service"
import { buildReferenceForecast } from "@/lib/reference-agent"

type Context = { params: Promise<{ marketId: string }> }

export async function POST(_: Request, context: Context) {
  try {
    const market = await loadAgentMarket()
    if (market.id.toLowerCase() !== (await context.params).marketId.toLowerCase()) {
      return Response.json({ message: "This is not the active DreamDEX market." }, { status: 404 })
    }
    if (!market.isLive || market.upPrice === null) {
      return Response.json({ message: "The active market has no executable reference price." }, { status: 409 })
    }
    const chart = await loadOracleChart(market)
    if (chart.currentPrice === null) {
      return Response.json({ message: "Somnia oracle data is not available yet." }, { status: 503 })
    }
    const forecast = buildReferenceForecast({
      asset: market.asset,
      strike: market.strike,
      oraclePrice: chart.currentPrice,
      upPrice: market.upPrice,
      observedAt: chart.updatedAt ?? Date.now(),
    })
    const receipt = await getForecastService().publish({
      marketId: market.id,
      creatorType: "AGENT",
      creatorId: "proofside-sentinel",
      creatorWallet: (process.env.REFERENCE_AGENT_WALLET || "0x0000000000000000000000000000000000000001") as `0x${string}`,
      authorizationType: "AGENT_API",
      authorizationValue: "proofside-sentinel-rule-v1",
      direction: forecast.direction,
      confidenceBps: forecast.confidenceBps,
      thesis: forecast.thesis,
      counterCase: forecast.counterCase,
      invalidationCondition: forecast.invalidationCondition,
    })
    return Response.json({ forecast, receipt }, { status: 201, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reference agent failed."
    return Response.json({ message }, { status: message === "MARKET_LOCKED" ? 409 : 503 })
  }
}
