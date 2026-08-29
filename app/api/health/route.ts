import { NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { DREAMDEX, somniaTestnet } from "@/lib/config"
import { currentMarket } from "@/lib/dreamdex"

export const dynamic = "force-dynamic"

export async function GET() {
  const startedAt = Date.now()
  const client = createPublicClient({ chain: somniaTestnet, transport: http(DREAMDEX.rpcUrl) })
  const [block, market] = await Promise.allSettled([client.getBlockNumber(), currentMarket()])
  const rpcHealthy = block.status === "fulfilled"
  const marketHealthy = market.status === "fulfilled"
  const status = rpcHealthy && marketHealthy ? 200 : rpcHealthy || marketHealthy ? 207 : 503

  return NextResponse.json({
    status: status === 200 ? "healthy" : status === 207 ? "degraded" : "unavailable",
    rpc: rpcHealthy ? { healthy: true, latestBlock: block.value.toString() } : { healthy: false },
    dreamdex: marketHealthy ? {
      healthy: true,
      venue: DREAMDEX.venueId,
      marketId: market.value.id,
      phase: market.value.phase,
    } : { healthy: false, venue: DREAMDEX.venueId },
    latencyMs: Date.now() - startedAt,
    checkedAt: Date.now(),
  }, { status, headers: { "Cache-Control": "no-store" } })
}
