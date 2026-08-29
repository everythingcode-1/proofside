import { openDatabase } from "./db"
import type { Direction, MarketPhase, RoomState } from "./types"

type ConvictionRow = { direction: Direction }
export type TransitionRow = {
  id: number
  marketId: string
  fromPhase: MarketPhase | null
  toPhase: MarketPhase
  source: "snapshot" | "websocket" | "transaction"
  occurredAt: number
}

export function createRoomStore(filename?: string) {
  const db = openDatabase(filename)
  const upsertConviction = db.prepare(`
    INSERT INTO convictions (market_id, wallet, direction, transaction_hash, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (market_id, wallet) DO UPDATE SET
      direction = excluded.direction,
      transaction_hash = COALESCE(excluded.transaction_hash, convictions.transaction_hash),
      updated_at = excluded.updated_at
  `)

  return {
    setConviction(roomId: string, wallet: string, direction: Direction, transactionHash?: `0x${string}`) {
      upsertConviction.run(roomId.toLowerCase(), wallet.toLowerCase(), direction, transactionHash?.toLowerCase() ?? null, Date.now())
      return this.getRoom(roomId)
    },

    getRoom(roomId: string): RoomState {
      const votes = db.prepare("SELECT direction FROM convictions WHERE market_id = ?").all(roomId.toLowerCase()) as unknown as ConvictionRow[]
      const up = votes.filter((vote) => vote.direction === "UP").length
      const down = votes.length - up
      return {
        roomId,
        participants: votes.length,
        up,
        down,
        upPercent: votes.length ? Math.round((up / votes.length) * 100) : 50,
        downPercent: votes.length ? Math.round((down / votes.length) * 100) : 50,
      }
    },

    recordTransition(marketId: string, fromPhase: MarketPhase | null, toPhase: MarketPhase, source: TransitionRow["source"], occurredAt = Date.now()) {
      const latest = db.prepare("SELECT to_phase FROM transitions WHERE market_id = ? ORDER BY id DESC LIMIT 1").get(marketId.toLowerCase()) as { to_phase?: MarketPhase } | undefined
      if (latest?.to_phase === toPhase) return false
      db.prepare("INSERT INTO transitions (market_id, from_phase, to_phase, source, occurred_at) VALUES (?, ?, ?, ?, ?)")
        .run(marketId.toLowerCase(), fromPhase, toPhase, source, occurredAt)
      return true
    },

    getTransitions(marketId: string): TransitionRow[] {
      const rows = db.prepare(`
        SELECT id, market_id, from_phase, to_phase, source, occurred_at
        FROM transitions WHERE market_id = ? ORDER BY id DESC LIMIT 20
      `).all(marketId.toLowerCase()) as unknown as Array<{
        id: number; market_id: string; from_phase: MarketPhase | null; to_phase: MarketPhase; source: TransitionRow["source"]; occurred_at: number
      }>
      return rows.map((row) => ({
        id: row.id,
        marketId: row.market_id,
        fromPhase: row.from_phase,
        toPhase: row.to_phase,
        source: row.source,
        occurredAt: row.occurred_at,
      }))
    },

    associateTransaction(marketId: string, wallet: string, direction: Direction, hash: `0x${string}`, state: string) {
      db.prepare(`
        INSERT INTO transactions (hash, market_id, wallet, direction, state, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (hash) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at
      `).run(hash.toLowerCase(), marketId.toLowerCase(), wallet.toLowerCase(), direction, state, Date.now())
    },

    clearRooms() {
      db.exec("DELETE FROM convictions; DELETE FROM transitions; DELETE FROM transactions;")
    },

    close() {
      db.close()
    },
  }
}

type RoomStore = ReturnType<typeof createRoomStore>
let singleton: RoomStore | undefined
const store = () => (singleton ??= createRoomStore())

export const setConviction: RoomStore["setConviction"] = (...args) => store().setConviction(...args)
export const getRoom: RoomStore["getRoom"] = (...args) => store().getRoom(...args)
export const recordTransition: RoomStore["recordTransition"] = (...args) => store().recordTransition(...args)
export const getTransitions: RoomStore["getTransitions"] = (...args) => store().getTransitions(...args)
export const associateTransaction: RoomStore["associateTransaction"] = (...args) => store().associateTransaction(...args)
export const clearRooms: RoomStore["clearRooms"] = () => store().clearRooms()
