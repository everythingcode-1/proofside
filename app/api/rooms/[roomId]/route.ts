import { NextRequest, NextResponse } from "next/server"
import { isAddress } from "viem"
import { currentMarket } from "@/lib/dreamdex"
import { getRoom, setConviction } from "@/lib/room-store"

type Context = { params: Promise<{ roomId: string }> }

export async function GET(_: NextRequest, context: Context) {
  const { roomId } = await context.params
  return NextResponse.json(getRoom(roomId), { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: NextRequest, context: Context) {
  const { roomId } = await context.params
  const body = (await request.json().catch(() => null)) as {
    wallet?: string
    direction?: string
    transactionHash?: `0x${string}`
  } | null

  if (!body || !body.wallet || !isAddress(body.wallet) || !["UP", "DOWN"].includes(body.direction || "")) {
    return NextResponse.json({ error: "A valid wallet and UP/DOWN direction are required." }, { status: 400 })
  }

  const market = await currentMarket().catch(() => null)
  if (!market || market.id !== roomId || !market.isLive) {
    return NextResponse.json({ error: "This room is no longer accepting conviction updates." }, { status: 409 })
  }

  return NextResponse.json(
    setConviction(roomId, body.wallet, body.direction as "UP" | "DOWN", body.transactionHash),
  )
}
