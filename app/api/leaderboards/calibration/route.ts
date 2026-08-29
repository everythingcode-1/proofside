import { buildCalibrationProfile, rankCalibrationProfiles } from "@/lib/calibration"
import { getForecastStore } from "@/lib/forecast-store"
export async function GET(request: Request) {
  const filter = new URL(request.url).searchParams.get("type") ?? "ALL"
  const groups = new Map<string, ReturnType<ReturnType<typeof getForecastStore>["listSettled"]>>()
  for (const row of getForecastStore().listSettled()) {
    if (filter !== "ALL" && row.creatorType !== filter) continue
    const key = `${row.creatorType}:${row.creatorId}`
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  const profiles = [...groups.entries()].map(([key, rows]) => buildCalibrationProfile(key.split(":").slice(1).join(":"), rows[0].creatorType, rows.map((row) => ({ direction: row.direction, confidenceBps: row.confidenceBps, outcome: row.outcome!, backed: Boolean(row.backingTxHash), revision: row.revision }))))
  return Response.json({ profiles: rankCalibrationProfiles(profiles) })
}
