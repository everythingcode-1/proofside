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
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      owner_wallet TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      framework TEXT NOT NULL DEFAULT 'custom',
      policy_json TEXT NOT NULL,
      policy_version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS agent_keys (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER,
      revoked_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS auth_challenges (
      nonce TEXT PRIMARY KEY,
      wallet TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS prediction_events (
      id TEXT PRIMARY KEY,
      market_id TEXT NOT NULL,
      actor_type TEXT NOT NULL CHECK (actor_type IN ('HUMAN', 'AGENT')),
      actor_id TEXT NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN')),
      confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
      reason TEXT NOT NULL DEFAULT '',
      supersedes_id TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS prediction_actor_market ON prediction_events (market_id, actor_type, actor_id, created_at);
    CREATE TABLE IF NOT EXISTS market_results (
      market_id TEXT PRIMARY KEY,
      asset TEXT NOT NULL,
      locks_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      outcome TEXT CHECK (outcome IN ('UP', 'DOWN') OR outcome IS NULL),
      settled_at INTEGER,
      verified_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verified_fills (
      transaction_hash TEXT PRIMARY KEY,
      market_id TEXT NOT NULL,
      wallet TEXT NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN')),
      quantity REAL NOT NULL,
      average_price REAL NOT NULL,
      cost REAL NOT NULL,
      fee REAL NOT NULL DEFAULT 0,
      agent_id TEXT,
      signal_id TEXT,
      verified_at INTEGER NOT NULL
    );
  `)
  return db
}
