import { getForecastService } from "@/lib/forecast-service"
import { getForecastStore } from "@/lib/forecast-store"

export async function GET() { return Response.json({ forecasts: getForecastStore().listRecent() }) }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ code: "INVALID_JSON", message: "A JSON body is required." }, { status: 400 })
  try {
    const receipt = await getForecastService().publish({ ...body, creatorType: "HUMAN", creatorId: body.creatorWallet, authorizationType: "EIP712", authorizationValue: body.signature })
    return Response.json({ receipt }, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message.split(":")[0] : "PUBLICATION_FAILED"
    const status = code === "SIGNATURE_INVALID" ? 401 : code === "MARKET_LOCKED" ? 409 : 400
    return Response.json({ code, message: "Forecast receipt could not be published.", retryable: false }, { status })
  }
}
