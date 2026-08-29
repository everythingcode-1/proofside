import { buildForecastPayload, hashForecastPayload } from "@/lib/forecast-receipt"
import { verifyForecastAnchor } from "@/lib/forecast-registry"
import { getForecastStore } from "@/lib/forecast-store"
type Context = { params: Promise<{ hash: string }> }
export async function GET(_request: Request, context: Context) {
  const hash = (await context.params).hash.toLowerCase() as `0x${string}`
  const receipt = getForecastStore().getByHash(hash)
  if (!receipt) return Response.json({ code: "NOT_FOUND", message: "Receipt not found." }, { status: 404 })
  const recomputed = hashForecastPayload(buildForecastPayload(receipt))
  let chain = { anchored: false, anchoredAt: 0 }
  try { chain = await verifyForecastAnchor(hash) } catch { /* explicit database proof state remains visible */ }
  return Response.json({ valid: recomputed === hash && (receipt.proofState === "SIGNED" || chain.anchored), contentMatches: recomputed === hash, chain, receipt })
}
