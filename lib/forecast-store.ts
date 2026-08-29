import { openDatabase } from "./db"
import type { CreatorType, ForecastProofState } from "./forecast-receipt"
import type { Direction } from "./types"

export type StoredForecast = {
  id: string; schemaVersion: 1; creatorType: CreatorType; creatorId: string; creatorWallet: `0x${string}`
  marketId: string; marketIdHash: `0x${string}`; direction: Direction; confidenceBps: number
  thesis: string; counterCase: string; invalidationCondition: string; createdAt: number; locksAt: number
  revision: number; previousReceiptHash: `0x${string}` | null; canonicalHash: `0x${string}`
  authorizationType: "EIP712" | "AGENT_API"; authorizationValue: string; proofState: ForecastProofState
  anchorTxHash?: `0x${string}` | null; anchorBlock?: number | null; anchoredAt?: number | null
  backingTxHash?: `0x${string}` | null; outcome?: Direction | null; resolutionStatus?: string | null; brierScore?: number | null
}

const mapRow = (row: Record<string, unknown>): StoredForecast => ({
  id: String(row.id), schemaVersion: Number(row.schema_version) as 1, creatorType: row.creator_type as CreatorType,
  creatorId: String(row.creator_id), creatorWallet: String(row.creator_wallet) as `0x${string}`,
  marketId: String(row.market_id), marketIdHash: String(row.market_id_hash) as `0x${string}`,
  direction: row.direction as Direction, confidenceBps: Number(row.confidence_bps), thesis: String(row.thesis),
  counterCase: String(row.counter_case), invalidationCondition: String(row.invalidation_condition),
  createdAt: Number(row.created_at), locksAt: Number(row.locks_at), revision: Number(row.revision),
  previousReceiptHash: row.previous_receipt_hash ? String(row.previous_receipt_hash) as `0x${string}` : null,
  canonicalHash: String(row.canonical_hash) as `0x${string}`, authorizationType: row.authorization_type as "EIP712" | "AGENT_API",
  authorizationValue: String(row.authorization_value), proofState: row.proof_state as ForecastProofState,
  anchorTxHash: row.anchor_tx_hash ? String(row.anchor_tx_hash) as `0x${string}` : null,
  anchorBlock: row.anchor_block === null || row.anchor_block === undefined ? null : Number(row.anchor_block),
  anchoredAt: row.anchored_at === null || row.anchored_at === undefined ? null : Number(row.anchored_at),
  backingTxHash: row.backing_tx_hash ? String(row.backing_tx_hash) as `0x${string}` : null,
  outcome: row.outcome as Direction | null | undefined,
  resolutionStatus: row.resolution_status === undefined ? undefined : String(row.resolution_status),
  brierScore: row.brier_score === null || row.brier_score === undefined ? null : Number(row.brier_score),
})

export function createForecastStore(filename?: string) {
  const db = openDatabase(filename)
  const select = `SELECT f.*, r.outcome, r.status AS resolution_status, r.brier_score FROM forecast_receipts f LEFT JOIN forecast_resolutions r ON r.receipt_hash=f.canonical_hash`
  return {
    createReceipt(row: StoredForecast) {
      db.prepare(`INSERT INTO forecast_receipts
        (id,schema_version,creator_type,creator_id,creator_wallet,market_id,market_id_hash,direction,confidence_bps,thesis,counter_case,invalidation_condition,created_at,locks_at,revision,previous_receipt_hash,canonical_hash,authorization_type,authorization_value,proof_state,backing_tx_hash)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        row.id,row.schemaVersion,row.creatorType,row.creatorId.toLowerCase(),row.creatorWallet.toLowerCase(),row.marketId.toLowerCase(),row.marketIdHash,row.direction,row.confidenceBps,row.thesis,row.counterCase,row.invalidationCondition,row.createdAt,row.locksAt,row.revision,row.previousReceiptHash,row.canonicalHash,row.authorizationType,row.authorizationValue,row.proofState,row.backingTxHash ?? null)
      return this.getById(row.id)!
    },
    getById(id: string) { const row = db.prepare(`${select} WHERE f.id=?`).get(id) as Record<string, unknown> | undefined; return row ? mapRow(row) : null },
    getByHash(hash: string) { const row = db.prepare(`${select} WHERE f.canonical_hash=?`).get(hash.toLowerCase()) as Record<string, unknown> | undefined; return row ? mapRow(row) : null },
    markAnchoring(hash: string) { db.prepare("UPDATE forecast_receipts SET proof_state='ANCHORING' WHERE canonical_hash=?").run(hash.toLowerCase()) },
    markAnchorFailed(hash: string) { db.prepare("UPDATE forecast_receipts SET proof_state='SIGNED' WHERE canonical_hash=?").run(hash.toLowerCase()) },
    markAnchored(hash: string, proof: { transactionHash: string; block: bigint; anchoredAt: number; late: boolean }) {
      db.prepare("UPDATE forecast_receipts SET proof_state=?,anchor_tx_hash=?,anchor_block=?,anchored_at=? WHERE canonical_hash=?")
        .run(proof.late ? "LATE" : "ANCHORED", proof.transactionHash.toLowerCase(), Number(proof.block), proof.anchoredAt, hash.toLowerCase())
    },
    resolve(hash: string, outcome: Direction | null, status: "SETTLED" | "VOID", resolvedAt: number, brierScore: number | null) {
      db.prepare("INSERT OR REPLACE INTO forecast_resolutions (receipt_hash,outcome,status,resolved_at,brier_score,scored_at) VALUES (?,?,?,?,?,?)")
        .run(hash.toLowerCase(), outcome, status, resolvedAt, brierScore, Date.now())
      db.prepare("UPDATE forecast_receipts SET proof_state=? WHERE canonical_hash=?").run(status === "VOID" ? "VOID" : "RESOLVED", hash.toLowerCase())
    },
    listByCreator(creatorType: CreatorType, creatorId: string) { return (db.prepare(`${select} WHERE f.creator_type=? AND f.creator_id=? ORDER BY f.created_at DESC`).all(creatorType, creatorId.toLowerCase()) as unknown as Record<string, unknown>[]).map(mapRow) },
    listForMarket(marketId: string) { return (db.prepare(`${select} WHERE f.market_id=? ORDER BY f.created_at DESC`).all(marketId.toLowerCase()) as unknown as Record<string, unknown>[]).map(mapRow) },
    listSettled() { return (db.prepare(`${select} WHERE r.status='SETTLED'`).all() as unknown as Record<string, unknown>[]).map(mapRow) },
    listRecent(limit = 20) { return (db.prepare(`${select} ORDER BY f.created_at DESC LIMIT ?`).all(limit) as unknown as Record<string, unknown>[]).map(mapRow) },
    close() { db.close() },
  }
}

export type ForecastStore = ReturnType<typeof createForecastStore>
let singleton: ForecastStore | undefined
export const getForecastStore = () => (singleton ??= createForecastStore())
