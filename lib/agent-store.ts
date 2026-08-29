import { randomUUID } from "node:crypto"
import { openDatabase } from "./db"
import type { Direction } from "./types"

export type ActorType = "HUMAN" | "AGENT"
export type AgentStatus = "ACTIVE" | "REVOKED"
export type AgentPolicy = {
  assets: Array<"BTC" | "ETH">
  allowRevisions: boolean
  minimumConfidence?: number
}

export type AgentRecord = {
  id: string
  ownerWallet: string
  name: string
  description: string
  framework: string
  policy: AgentPolicy
  policyVersion: number
  status: AgentStatus
  createdAt: number
  updatedAt: number
}

export type PredictionRecord = {
  id: string
  marketId: string
  actorType: ActorType
  actorId: string
  direction: Direction
  confidence: number | null
  reason: string
  supersedesId: string | null
  createdAt: number
}

export type MarketResultRecord = {
  marketId: string
  asset: string
  locksAt: number
  status: string
  outcome: Direction | null
  settledAt: number | null
  verifiedAt: number
}

export type VerifiedFillRecord = {
  transactionHash: string
  marketId: string
  wallet: string
  direction: Direction
  quantity: number
  averagePrice: number
  cost: number
  fee: number
  agentId: string | null
  signalId: string | null
  verifiedAt: number
}

const prediction = (row: Record<string, unknown>): PredictionRecord => ({
  id: String(row.id),
  marketId: String(row.market_id),
  actorType: row.actor_type as ActorType,
  actorId: String(row.actor_id),
  direction: row.direction as Direction,
  confidence: row.confidence === null ? null : Number(row.confidence),
  reason: String(row.reason),
  supersedesId: row.supersedes_id === null ? null : String(row.supersedes_id),
  createdAt: Number(row.created_at),
})

const marketResult = (row: Record<string, unknown>): MarketResultRecord => ({
  marketId: String(row.market_id),
  asset: String(row.asset),
  locksAt: Number(row.locks_at),
  status: String(row.status),
  outcome: row.outcome as Direction | null,
  settledAt: row.settled_at === null ? null : Number(row.settled_at),
  verifiedAt: Number(row.verified_at),
})

export function createAgentStore(filename?: string) {
  const db = openDatabase(filename)

  return {
    saveChallenge(input: { nonce: string; wallet: string; purpose: string; expiresAt: number }) {
      db.prepare("INSERT INTO auth_challenges (nonce, wallet, purpose, expires_at) VALUES (?, ?, ?, ?)")
        .run(input.nonce, input.wallet.toLowerCase(), input.purpose, input.expiresAt)
    },

    consumeChallenge(nonce: string, wallet: string, purpose: string, now = Date.now(), expiresAt?: number) {
      const result = db.prepare(`
        UPDATE auth_challenges SET used_at = ?
        WHERE nonce = ? AND wallet = ? AND purpose = ? AND expires_at >= ? AND used_at IS NULL
          AND (? IS NULL OR expires_at = ?)
      `).run(now, nonce, wallet.toLowerCase(), purpose, now, expiresAt ?? null, expiresAt ?? null)
      return Number(result.changes) === 1
    },

    createAgent(input: Omit<AgentRecord, "createdAt" | "updatedAt" | "status" | "policyVersion"> & { createdAt?: number }) {
      const now = input.createdAt ?? Date.now()
      db.prepare(`
        INSERT INTO agents (id, owner_wallet, name, description, framework, policy_json, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
      `).run(input.id, input.ownerWallet.toLowerCase(), input.name, input.description, input.framework, JSON.stringify(input.policy), now, now)
      return this.getAgent(input.id)!
    },

    getAgent(id: string): AgentRecord | null {
      const row = db.prepare("SELECT * FROM agents WHERE id = ?").get(id) as Record<string, unknown> | undefined
      if (!row) return null
      return {
        id: String(row.id), ownerWallet: String(row.owner_wallet), name: String(row.name),
        description: String(row.description), framework: String(row.framework),
        policy: JSON.parse(String(row.policy_json)) as AgentPolicy,
        policyVersion: Number(row.policy_version), status: row.status as AgentStatus,
        createdAt: Number(row.created_at), updatedAt: Number(row.updated_at),
      }
    },

    saveKey(input: { id?: string; agentId: string; keyHash: string; keyPrefix: string; createdAt?: number }) {
      db.prepare("INSERT INTO agent_keys (id, agent_id, key_hash, key_prefix, created_at) VALUES (?, ?, ?, ?, ?)")
        .run(input.id ?? randomUUID(), input.agentId, input.keyHash.toLowerCase(), input.keyPrefix, input.createdAt ?? Date.now())
    },

    findAgentByKeyHash(keyHash: string) {
      const row = db.prepare(`
        SELECT a.id AS agent_id, a.status, k.id AS key_id, k.revoked_at
        FROM agent_keys k JOIN agents a ON a.id = k.agent_id WHERE k.key_hash = ?
      `).get(keyHash.toLowerCase()) as { agent_id: string; status: AgentStatus; key_id: string; revoked_at: number | null } | undefined
      if (!row) return null
      return { agent: this.getAgent(row.agent_id)!, keyId: row.key_id, keyRevoked: row.revoked_at !== null }
    },

    touchKey(keyId: string, at = Date.now()) {
      db.prepare("UPDATE agent_keys SET last_used_at = ? WHERE id = ?").run(at, keyId)
    },

    rotateKey(agentId: string, input: { keyHash: string; keyPrefix: string; at?: number }) {
      const at = input.at ?? Date.now()
      db.prepare("UPDATE agent_keys SET revoked_at = ? WHERE agent_id = ? AND revoked_at IS NULL").run(at, agentId)
      this.saveKey({ agentId, keyHash: input.keyHash, keyPrefix: input.keyPrefix, createdAt: at })
    },

    revokeAgent(agentId: string, at = Date.now()) {
      db.prepare("UPDATE agents SET status = 'REVOKED', updated_at = ? WHERE id = ?").run(at, agentId)
      db.prepare("UPDATE agent_keys SET revoked_at = ? WHERE agent_id = ? AND revoked_at IS NULL").run(at, agentId)
    },

    appendPrediction(input: Omit<PredictionRecord, "id" | "supersedesId">) {
      const marketId = input.marketId.toLowerCase()
      const actorId = input.actorId.toLowerCase()
      const previous = db.prepare(`
        SELECT id FROM prediction_events
        WHERE market_id = ? AND actor_type = ? AND actor_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1
      `).get(marketId, input.actorType, actorId) as { id: string } | undefined
      const id = randomUUID()
      db.prepare(`
        INSERT INTO prediction_events (id, market_id, actor_type, actor_id, direction, confidence, reason, supersedes_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, marketId, input.actorType, actorId, input.direction, input.confidence, input.reason, previous?.id ?? null, input.createdAt)
      return this.getPrediction(id)!
    },

    getPrediction(id: string) {
      const row = db.prepare("SELECT * FROM prediction_events WHERE id = ?").get(id) as Record<string, unknown> | undefined
      return row ? prediction(row) : null
    },

    getPredictionHistory(marketId: string, actorType: ActorType, actorId: string) {
      const rows = db.prepare(`
        SELECT * FROM prediction_events WHERE market_id = ? AND actor_type = ? AND actor_id = ? ORDER BY created_at ASC, rowid ASC
      `).all(marketId.toLowerCase(), actorType, actorId.toLowerCase()) as unknown as Record<string, unknown>[]
      return rows.map(prediction)
    },

    getEffectivePrediction(marketId: string, actorType: ActorType, actorId: string, before: number) {
      const row = db.prepare(`
        SELECT * FROM prediction_events
        WHERE market_id = ? AND actor_type = ? AND actor_id = ? AND created_at < ?
        ORDER BY created_at DESC, rowid DESC LIMIT 1
      `).get(marketId.toLowerCase(), actorType, actorId.toLowerCase(), before) as Record<string, unknown> | undefined
      return row ? prediction(row) : null
    },

    listEffectivePredictions(marketId: string, before: number) {
      const rows = db.prepare(`
        SELECT p.* FROM prediction_events p
        WHERE p.market_id = ? AND p.created_at < ? AND p.rowid = (
          SELECT p2.rowid FROM prediction_events p2
          WHERE p2.market_id = p.market_id AND p2.actor_type = p.actor_type AND p2.actor_id = p.actor_id AND p2.created_at < ?
          ORDER BY p2.created_at DESC, p2.rowid DESC LIMIT 1
        )
      `).all(marketId.toLowerCase(), before, before) as unknown as Record<string, unknown>[]
      return rows.map(prediction)
    },

    upsertMarketResult(input: MarketResultRecord) {
      db.prepare(`
        INSERT INTO market_results (market_id, asset, locks_at, status, outcome, settled_at, verified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (market_id) DO UPDATE SET asset=excluded.asset, locks_at=excluded.locks_at,
          status=excluded.status, outcome=excluded.outcome, settled_at=excluded.settled_at, verified_at=excluded.verified_at
      `).run(input.marketId.toLowerCase(), input.asset, input.locksAt, input.status, input.outcome, input.settledAt, input.verifiedAt)
    },

    listMarketResults() {
      return (db.prepare("SELECT * FROM market_results ORDER BY locks_at DESC").all() as unknown as Record<string, unknown>[]).map(marketResult)
    },

    saveVerifiedFill(input: VerifiedFillRecord) {
      db.prepare(`
        INSERT OR IGNORE INTO verified_fills
        (transaction_hash, market_id, wallet, direction, quantity, average_price, cost, fee, agent_id, signal_id, verified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(input.transactionHash.toLowerCase(), input.marketId.toLowerCase(), input.wallet.toLowerCase(), input.direction,
        input.quantity, input.averagePrice, input.cost, input.fee, input.agentId, input.signalId, input.verifiedAt)
    },

    listVerifiedFills() {
      return db.prepare("SELECT * FROM verified_fills ORDER BY verified_at DESC").all() as unknown as VerifiedFillRecord[]
    },

    close() { db.close() },
  }
}

export type AgentStore = ReturnType<typeof createAgentStore>

let singleton: AgentStore | undefined
export function getAgentStore() {
  return (singleton ??= createAgentStore())
}

export function setAgentStoreForTests(store?: AgentStore) {
  singleton = store
}
