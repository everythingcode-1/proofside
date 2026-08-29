import { NextRequest, NextResponse } from "next/server"
import { isAddress, isHash } from "viem"
import { currentMarket } from "@/lib/dreamdex"
import { associateTransaction, getRoom, setConviction } from "@/lib/room-store"
import { createRateLimiter } from "@/lib/rate-limit"

type Context = { params: Promise<{ roomId: string }> }
const rateLimit = createRateLimiter(12, 60_000)

export async function GET(_: NextRequest, context: Context) {
  const { roomId } = await context.params
  return NextResponse.json(getRoom(roomId), { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: NextRequest, context: Context) {
  const { roomId } = await context.params
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  const rate = rateLimit(ip)
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many conviction updates. Try again shortly." }, {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil((rate.resetsAt - Date.now()) / 1_000))) },
    })
  }
  const size = Number(request.headers.get("content-length") || 0)
  if (size > 2_048) return NextResponse.json({ error: "Request body is too large." }, { status: 413 })
  const body = (await request.json().catch(() => null)) as {
    wallet?: string
    direction?: string
    transactionHash?: `0x${string}`
  } | null

  if (!body || !body.wallet || !isAddress(body.wallet) || !["UP", "DOWN"].includes(body.direction || "")) {
    return NextResponse.json({ error: "A valid wallet and UP/DOWN direction are required." }, { status: 400 })
  }
  if (body.transactionHash && !isHash(body.transactionHash)) {
    return NextResponse.json({ error: "Transaction hash is invalid." }, { status: 400 })
  }

  const market = await currentMarket().catch(() => null)
  if (!market || market.id !== roomId || !market.isLive) {
    return NextResponse.json({ error: "This room is no longer accepting conviction updates." }, { status: 409 })
  }

  const direction = body.direction as "UP" | "DOWN"
  if (body.transactionHash) associateTransaction(roomId, body.wallet, direction, body.transactionHash, "CONFIRMED")
  return NextResponse.json(setConviction(roomId, body.wallet, direction, body.transactionHash))
}
