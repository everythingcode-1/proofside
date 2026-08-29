import { authenticateAgent, apiError, readJson } from "@/lib/agent-api"
import { getForecastService } from "@/lib/forecast-service"
type Context = { params: Promise<{ marketId: string }> }
export async function PUT(request: Request, context: Context) {
  const auth = authenticateAgent(request)
  if (auth.error) return auth.error
  const body = await readJson(request)
  if (!body) return apiError("INVALID_JSON", "A JSON body is required.", 400)
  try {
    const receipt = await getForecastService().publish({
      marketId: (await context.params).marketId, creatorType: "AGENT", creatorId: auth.agent.id,
      creatorWallet: auth.agent.ownerWallet as `0x${string}`, authorizationType: "AGENT_API", authorizationValue: auth.agent.id,
      direction: body.direction as "UP" | "DOWN", confidenceBps: Number(body.confidenceBps), thesis: String(body.thesis ?? ""),
      counterCase: String(body.counterCase ?? ""), invalidationCondition: String(body.invalidationCondition ?? ""),
    })
    return Response.json({ receipt }, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message.split(":")[0] : "PUBLICATION_FAILED"
    return apiError(code, "Forecast receipt could not be published.", code === "MARKET_LOCKED" ? 409 : 400)
  }
}
