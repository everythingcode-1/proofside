import { NextResponse } from "next/server"
import { getMarketSnapshot } from "../../../lib/market-snapshot"
import { getTransitions, recordTransition } from "@/lib/room-store"
import { getForecastStore } from "@/lib/forecast-store"
import { reconcileForecastReceipts } from "@/lib/forecast-settlement"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { market, fetchedAt, source } = await getMarketSnapshot()
    const prior = getTransitions(market.id)[0]?.toPhase ?? null
    recordTransition(market.id, prior, market.phase, "snapshot", fetchedAt)
    reconcileForecastReceipts(getForecastStore(), market, fetchedAt)
    return NextResponse.json({ market, transitions: getTransitions(market.id), fetchedAt, source }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    const fetchedAt = Date.now()
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DreamDEX market read failed.", fetchedAt },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
