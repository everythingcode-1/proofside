import { loadAgentMarket } from "@/lib/agent-market"
import { marketExecutionEstimate } from "@/lib/dreamdex"

type Context = { params: Promise<{ marketId: string }> }

export async function GET(request: Request, context: Context) {
  const market = await loadAgentMarket().catch(() => null)
  const { marketId } = await context.params
  if (!market || market.id.toLowerCase() !== marketId.toLowerCase()) return Response.json({ message: "Active market not found." }, { status: 404 })
  const query = new URL(request.url).searchParams
  const direction = query.get("direction")
  const shares = Number(query.get("shares"))
  if ((direction !== "UP" && direction !== "DOWN") || !Number.isFinite(shares) || shares <= 0) return Response.json({ message: "Direction or contract amount is invalid." }, { status: 400 })
  try {
    return Response.json({ estimate: await marketExecutionEstimate(market, direction, shares) }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return Response.json({ message: "Executable depth is temporarily unavailable." }, { status: 503 })
  }
}
