import { buildCalibrationProfile } from "@/lib/calibration"
import { getForecastStore } from "@/lib/forecast-store"
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, context: Context) {
  const creatorId = (await context.params).id
  const creatorType = new URL(request.url).searchParams.get("type") === "AGENT" ? "AGENT" : "HUMAN"
  const rows = getForecastStore().listByCreator(creatorType, creatorId).filter((row) => row.outcome)
  return Response.json({ profile: buildCalibrationProfile(creatorId, creatorType, rows.map((row) => ({ direction: row.direction, confidenceBps: row.confidenceBps, outcome: row.outcome!, backed: Boolean(row.backingTxHash), revision: row.revision }))) })
}
