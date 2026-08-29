import { NextResponse } from "next/server"
import { currentMarket } from "@/lib/dreamdex"
import { getTransitions, recordTransition } from "@/lib/room-store"
import { getForecastStore } from "@/lib/forecast-store"
import { reconcileForecastReceipts } from "@/lib/forecast-settlement"

export const dynamic = "force-dynamic"

export async function GET() {
  const fetchedAt = Date.now()
  try {
    const market = await currentMarket()
    const prior = getTransitions(market.id)[0]?.toPhase ?? null
    recordTransition(market.id, prior, market.phase, "snapshot", fetchedAt)
    reconcileForecastReceipts(getForecastStore(), market, fetchedAt)
    return NextResponse.json({ market, transitions: getTransitions(market.id), fetchedAt }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DreamDEX market read failed.", fetchedAt },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
