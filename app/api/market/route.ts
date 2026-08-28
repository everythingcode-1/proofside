import { NextResponse } from "next/server"
import { currentMarket } from "@/lib/dreamdex"

export const dynamic = "force-dynamic"

export async function GET() {
  const fetchedAt = Date.now()
  try {
    const market = await currentMarket()
    return NextResponse.json({ market, fetchedAt }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DreamDEX market read failed.", fetchedAt },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
