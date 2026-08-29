import { mkdirSync } from "node:fs"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"

export function openDatabase(filename = process.env.DREAMPULSE_DB || path.join(process.cwd(), "data", "dreampulse.sqlite")) {
  if (filename !== ":memory:") mkdirSync(path.dirname(filename), { recursive: true })
  const db = new DatabaseSync(filename)
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")
  db.exec(`
    CREATE TABLE IF NOT EXISTS convictions (
      market_id TEXT NOT NULL,
      wallet TEXT NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN')),
      transaction_hash TEXT,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (market_id, wallet)
    );
    CREATE TABLE IF NOT EXISTS transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market_id TEXT NOT NULL,
      from_phase TEXT,
      to_phase TEXT NOT NULL,
      source TEXT NOT NULL,
      occurred_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transactions (
      hash TEXT PRIMARY KEY,
      market_id TEXT NOT NULL,
      wallet TEXT NOT NULL,
      direction TEXT NOT NULL,
      state TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `)
  return db
}
