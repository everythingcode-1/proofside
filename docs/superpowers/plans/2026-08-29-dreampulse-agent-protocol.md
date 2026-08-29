# DreamPulse Agent Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add wallet-owned signal agents, auditable REST signals, verified DreamDEX trade attribution, and separate predictor/trader leaderboards to DreamPulse.

**Architecture:** Keep the existing Next.js application and SQLite database. Add focused repositories and pure scoring/proof modules behind route handlers; external agents authenticate with hashed bearer keys and own their messaging channels. DreamDEX and Somnia remain authoritative for market status, fills, and settlement.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Node 22 `node:sqlite` and `node:crypto`, viem, `@somnia-chain/markets-sdk`, Vitest.

---

## File map

- Modify `lib/db.ts` — create agent, prediction, market-result, and verified-fill tables.
- Create `lib/agent-auth.ts` — challenge messages, API-key generation/hash/comparison, and stable auth errors.
- Create `lib/agent-auth.test.ts` — deterministic auth/key tests.
- Create `lib/agent-store.ts` — SQLite operations for challenges, agents, keys, signals, results, and fills.
- Create `lib/agent-store.test.ts` — persistence, revision, revoke, and lock tests.
- Create `lib/leaderboards.ts` — pure prediction/trading score calculation.
- Create `lib/leaderboards.test.ts` — eligibility, void, streak, PnL, and tie-break tests.
- Create `lib/trade-proof.ts` — independently decode and verify DreamDEX binary order receipts.
- Create `lib/trade-proof.test.ts` — receipt/calldata validation tests.
- Create `lib/agent-api.ts` — bearer authentication and consistent error envelopes.
- Create `app/api/agents/challenge/route.ts` — issue registration/rotation/revocation challenges.
- Create `app/api/agents/register/route.ts` — verify owner signature and create agent/key.
- Create `app/api/agents/rotate-key/route.ts` — rotate an owner-controlled key.
- Create `app/api/agents/revoke/route.ts` — revoke an agent.
- Create `app/api/agent/markets/live/route.ts` — agent-friendly live market context.
- Create `app/api/agent/signals/[marketId]/route.ts` — create/revise/read a signal.
- Create `app/api/markets/[marketId]/signals/route.ts` — public effective agent signals for the room.
- Create `app/api/agent/performance/route.ts` — authenticated agent performance.
- Create `app/api/leaderboards/predictions/route.ts` — public prediction standings.
- Create `app/api/leaderboards/trading/route.ts` — public verified-trade standings.
- Create `app/api/trades/verify/route.ts` — verify and persist the transaction proof.
- Modify `app/api/rooms/[roomId]/route.ts` — append human prediction events and attach validated attribution.
- Create `app/agents/page.tsx` and `components/agent-console.tsx` — wallet registration and one-time key reveal.
- Create `app/leaderboards/page.tsx` and `components/leaderboards.tsx` — dual board UI.
- Modify `components/prediction-room.tsx` — agent signals, badges, deep-link preselection, and proof submission.
- Modify `app/globals.css` — small styles for badges, signal list, console, and boards.
- Create `docs/agent-api.md` — curl integration guide usable by any agent runtime.

### Task 1: Persist agent identities and prediction evidence

**Files:**
- Modify: `lib/db.ts`
- Create: `lib/agent-store.ts`
- Create: `lib/agent-store.test.ts`

- [ ] **Step 1: Write failing repository tests**

Create `lib/agent-store.test.ts` with an in-memory store and these assertions:

```ts
import { describe, expect, it } from "vitest"
import { createAgentStore } from "./agent-store"

describe("agent store", () => {
  it("consumes a challenge only once", () => {
    const store = createAgentStore(":memory:")
    store.saveChallenge({ nonce: "n1", wallet: "0xabc", purpose: "REGISTER", expiresAt: 2_000 })
    expect(store.consumeChallenge("n1", "0xabc", "REGISTER", 1_000)).toBe(true)
    expect(store.consumeChallenge("n1", "0xabc", "REGISTER", 1_000)).toBe(false)
    store.close()
  })

  it("keeps signal revisions append-only", () => {
    const store = createAgentStore(":memory:")
    const first = store.appendPrediction({ marketId: "m1", actorType: "AGENT", actorId: "a1", direction: "UP", confidence: 70, reason: "first", createdAt: 100 })
    const second = store.appendPrediction({ marketId: "m1", actorType: "AGENT", actorId: "a1", direction: "DOWN", confidence: 80, reason: "revised", createdAt: 200 })
    expect(second.supersedesId).toBe(first.id)
    expect(store.getPredictionHistory("m1", "AGENT", "a1")).toHaveLength(2)
    expect(store.getEffectivePrediction("m1", "AGENT", "a1", 150)?.direction).toBe("UP")
    store.close()
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx vitest run lib/agent-store.test.ts`  
Expected: FAIL because `./agent-store` does not exist.

- [ ] **Step 3: Add the minimal schema**

Extend the SQL block in `lib/db.ts` with the exact tables from the design. Use SQLite constraints for actor type, direction, status, and confidence:

```sql
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  owner_wallet TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  framework TEXT NOT NULL DEFAULT 'custom',
  policy_json TEXT NOT NULL,
  policy_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','REVOKED')),
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
  actor_type TEXT NOT NULL CHECK (actor_type IN ('HUMAN','AGENT')),
  actor_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('UP','DOWN')),
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  reason TEXT NOT NULL DEFAULT '',
  supersedes_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS market_results (
  market_id TEXT PRIMARY KEY,
  asset TEXT NOT NULL,
  locks_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  outcome TEXT CHECK (outcome IN ('UP','DOWN') OR outcome IS NULL),
  settled_at INTEGER,
  verified_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS verified_fills (
  transaction_hash TEXT PRIMARY KEY,
  market_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('UP','DOWN')),
  quantity REAL NOT NULL,
  average_price REAL NOT NULL,
  cost REAL NOT NULL,
  fee REAL NOT NULL DEFAULT 0,
  agent_id TEXT,
  signal_id TEXT,
  verified_at INTEGER NOT NULL
);
```

- [ ] **Step 4: Implement `createAgentStore`**

Implement only prepared-statement methods used by this release: `saveChallenge`, atomic `consumeChallenge`, `createAgent`, `saveKey`, `findAgentByKeyHash`, `rotateKey`, `revokeAgent`, `appendPrediction`, `getPredictionHistory`, `getEffectivePrediction`, `listEffectivePredictions`, `upsertMarketResult`, `listMarketResults`, `saveVerifiedFill`, and `listVerifiedFills`. Normalize wallet, market, hash, and key-hash values to lowercase.

Use `crypto.randomUUID()` for public row IDs; do not introduce a UUID dependency.

- [ ] **Step 5: Run tests and commit**

Run: `npx vitest run lib/agent-store.test.ts && npm run typecheck`  
Expected: PASS.

```bash
git add lib/db.ts lib/agent-store.ts lib/agent-store.test.ts
git commit -m "feat: persist agent identities and predictions"
```

### Task 2: Add wallet challenges and API-key security

**Files:**
- Create: `lib/agent-auth.ts`
- Create: `lib/agent-auth.test.ts`

- [ ] **Step 1: Write failing auth tests**

```ts
import { describe, expect, it } from "vitest"
import { challengeMessage, createAgentKey, hashAgentKey, matchesAgentKey } from "./agent-auth"

describe("agent auth", () => {
  it("binds registration to Somnia, wallet, nonce, and expiry", () => {
    expect(challengeMessage({ wallet: "0xabc", purpose: "REGISTER", nonce: "n1", expiresAt: 123 }))
      .toContain("DreamPulse Agent Protocol\nChain ID: 50312\nWallet: 0xabc\nPurpose: REGISTER\nNonce: n1\nExpires At: 123")
  })

  it("stores only a verifiable key hash", () => {
    const raw = createAgentKey()
    expect(raw.startsWith("dp_agent_")).toBe(true)
    expect(matchesAgentKey(raw, hashAgentKey(raw))).toBe(true)
    expect(matchesAgentKey(`${raw}x`, hashAgentKey(raw))).toBe(false)
  })
})
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run lib/agent-auth.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement with Node crypto**

`createAgentKey()` returns `dp_agent_${randomBytes(32).toString("base64url")}`. `hashAgentKey()` returns a lowercase SHA-256 hex digest. `matchesAgentKey()` hashes the candidate and compares equal-length buffers with `timingSafeEqual`. `challengeMessage()` must emit the exact deterministic text asserted above plus `Domain: DreamPulse`.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run lib/agent-auth.test.ts && npm run typecheck`  
Expected: PASS.

```bash
git add lib/agent-auth.ts lib/agent-auth.test.ts
git commit -m "feat: secure DreamPulse agent credentials"
```

### Task 3: Expose registration, rotation, and revocation routes

**Files:**
- Create: `lib/agent-api.ts`
- Create: `app/api/agents/challenge/route.ts`
- Create: `app/api/agents/register/route.ts`
- Create: `app/api/agents/rotate-key/route.ts`
- Create: `app/api/agents/revoke/route.ts`
- Create: `app/api/agents/agents.test.ts`

- [ ] **Step 1: Write route-level tests**

Test the handlers with `Request` objects and an injected in-memory store seam. Assert: invalid address is `400`; expired/reused challenge is `401 CHALLENGE_EXPIRED`; bad signature is `401 SIGNATURE_INVALID`; successful registration returns raw key once; serialized agent reads never include `key_hash`; revoked agent key gets `401 AGENT_REVOKED`.

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run app/api/agents/agents.test.ts`  
Expected: FAIL because route modules do not exist.

- [ ] **Step 3: Implement stable response helpers**

In `lib/agent-api.ts`, export:

```ts
export const apiError = (code: string, message: string, status: number, retryable = false) =>
  Response.json({ error: { code, message, retryable } }, { status })
```

Add `authenticateAgent(request)` which reads a Bearer key, hashes it, loads the active agent/key, touches `last_used_at`, and otherwise returns the stable `INVALID_API_KEY` or `AGENT_REVOKED` error.

- [ ] **Step 4: Implement challenge and owner routes**

Use `viem.verifyMessage` with the deterministic challenge. Validate name length 2–48, description 0–280, framework 1–32, assets subset of `BTC|ETH`, boolean revision policy, and confidence 0–100. Challenge lifetime is five minutes. Registration returns `{ agent, apiKey }`; rotation returns `{ apiKey }`; revoke returns `{ revoked: true }`.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run app/api/agents/agents.test.ts && npm test && npm run typecheck`  
Expected: all tests PASS.

```bash
git add lib/agent-api.ts app/api/agents
git commit -m "feat: register and manage signal agents"
```

### Task 4: Add live-market and signal protocol

**Files:**
- Create: `app/api/agent/markets/live/route.ts`
- Create: `app/api/agent/signals/[marketId]/route.ts`
- Create: `app/api/agent/signals/signals.test.ts`
- Modify: `app/api/rooms/[roomId]/route.ts`

- [ ] **Step 1: Write failing signal tests**

Cover authenticated creation, optional confidence/reason validation, policy asset rejection, revision rejection when disabled, append-only revision when enabled, unknown market, authoritative locked market, `DREAMDEX_UNAVAILABLE`, and public effective-signal output that omits key material. Assert the response trade URL contains encoded market, direction, agent, and signal IDs.

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run app/api/agent/signals/signals.test.ts`  
Expected: FAIL because signal routes do not exist.

- [ ] **Step 3: Implement agent market context**

Reuse `currentMarket()` and return only safe fields: market ID, asset, question, phase, lock time, UP/DOWN price, symbols, and server timestamp. Do not return environment configuration or credentials.

- [ ] **Step 4: Implement signal PUT/GET**

Authenticate first, cap body at 2 KB, validate fields, load authoritative market state, enforce policy, append the event, and return:

```ts
{
  signalId: prediction.id,
  accepted: true,
  marketLocksAt: market.locksAt,
  tradeUrl: `/?${new URLSearchParams({ market: market.id, direction, agent: agent.id, signal: prediction.id })}`,
}
```

GET returns the authenticated agent's current signal plus its revision history.

Add `GET /api/markets/:marketId/signals` for the room. It returns active agents' effective pre-lock signals with public profile fields, direction, confidence, reason, revision time, settled accuracy, and sample size. It never returns owner challenges, key hashes, or revoked agents.

- [ ] **Step 5: Append human prediction events**

After the existing room route validates a conviction, append a `HUMAN` prediction event using the normalized wallet as actor ID. Preserve the existing `convictions` aggregate.

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run app/api/agent/signals/signals.test.ts lib/room-store.test.ts && npm run typecheck`  
Expected: PASS.

```bash
git add app/api/agent app/api/markets/[marketId]/signals/route.ts app/api/rooms/[roomId]/route.ts
git commit -m "feat: accept auditable human and agent predictions"
```

### Task 5: Verify DreamDEX fills server-side

**Files:**
- Create: `lib/trade-proof.ts`
- Create: `lib/trade-proof.test.ts`
- Create: `app/api/trades/verify/route.ts`
- Modify: `components/prediction-room.tsx`

- [ ] **Step 1: Write failing proof tests**

Use fixture transactions/receipts to assert rejection of a reverted receipt, wrong sender, wrong pool, no `OrderFilled`, and direction mismatch. Assert a valid `placeBinaryOrder` with kind `0` maps to UP and kind `2` maps to DOWN, with weighted quantity/cost derived from fill logs.

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run lib/trade-proof.test.ts`  
Expected: FAIL because verifier does not exist.

- [ ] **Step 3: Implement calldata and log verification**

Use viem `decodeFunctionData` with:

```ts
const binaryOrderAbi = parseAbi([
  "function placeBinaryOrder(uint8 kind,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k,uint64 userData)",
  "event OrderFilled(uint256 indexed takerOrderId,uint256 indexed makerOrderId,uint256 quantityFilled,uint256 takerRemainingQuantity,uint256 makerRemainingQuantity,uint256 fillPrice)",
])
```

Require receipt success, transaction sender equal to claimed wallet, transaction target equal to the market pool, and at least one decoded fill. Kinds `0/1` are YES and `2/3` are NO; this application accepts only buy kinds `0` and `2`. Convert six-decimal raw quantities and prices, complement YES fill price for DOWN, and return one normalized proof.

- [ ] **Step 4: Implement verification route and UI call**

POST `{ hash, marketId, agentId?, signalId? }`. Resolve the market snapshot, fetch transaction and receipt from Somnia RPC, verify proof, validate attribution IDs belong together, store the fill, and return it. In `PredictionRoom`, call this endpoint after SDK confirmation instead of posting an unverified transaction association.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run lib/trade-proof.test.ts && npm test && npm run typecheck`  
Expected: PASS.

```bash
git add lib/trade-proof.ts lib/trade-proof.test.ts app/api/trades/verify/route.ts components/prediction-room.tsx
git commit -m "feat: verify DreamDEX fills for attribution"
```

### Task 6: Reconcile results and calculate both leaderboards

**Files:**
- Create: `lib/leaderboards.ts`
- Create: `lib/leaderboards.test.ts`
- Create: `app/api/leaderboards/predictions/route.ts`
- Create: `app/api/leaderboards/trading/route.ts`
- Create: `app/api/agent/performance/route.ts`
- Modify: `app/api/market/route.ts`

- [ ] **Step 1: Write failing scoring tests**

```ts
it("ranks eligible predictors by accuracy, correct count, then streak", () => {
  const rows = predictionLeaderboard(fixtures)
  expect(rows[0]).toMatchObject({ actorId: "agent-a", accuracy: 80, correct: 8, settled: 10 })
  expect(rows.find((row) => row.actorId === "new-agent")?.eligible).toBe(false)
})

it("excludes voids and calculates settled trading PnL", () => {
  expect(tradingLeaderboard(fixtures)[0]).toMatchObject({ wallet: "0xabc", realizedPnl: 0.279, fills: 1 })
})
```

Include fixtures with revision after lock, void, loss, tie, partial fill, and fewer than five predictions.

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run lib/leaderboards.test.ts`  
Expected: FAIL because scoring functions do not exist.

- [ ] **Step 3: Implement pure scoring functions**

Select the latest event with `createdAt < locksAt` per actor and market. Exclude void/unsettled results. Calculate accuracy as `correct / settled * 100`, eligibility at five, and current streak from newest backward. Sort exactly by accuracy, correct, streak, then actor ID for deterministic output.

For trading rows, payout is filled quantity when direction equals outcome and zero otherwise; PnL is payout minus cost and verified fee; ROI uses settled cost and returns zero when cost is zero.

- [ ] **Step 4: Add bounded reconciliation**

When `/api/market` sees a market, upsert its snapshot. Before returning a leaderboard, inspect at most 20 unresolved stored markets, read authoritative DreamDEX status/outcome, and persist settled/void results. A failed read leaves the prior result unchanged and marks the response `reconciliation: "degraded"` without inventing an outcome.

- [ ] **Step 5: Add public and authenticated routes**

Public routes return ranked and unranked sections plus `calculatedAt`. Agent performance authenticates the agent and returns its own prediction statistics and referral metrics only.

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run lib/leaderboards.test.ts && npm test && npm run typecheck`  
Expected: PASS.

```bash
git add lib/leaderboards.ts lib/leaderboards.test.ts app/api/leaderboards app/api/agent/performance app/api/market/route.ts
git commit -m "feat: rank predictors and verified traders"
```

### Task 7: Build agent console, signal cards, and leaderboard UI

**Files:**
- Create: `app/agents/page.tsx`
- Create: `components/agent-console.tsx`
- Create: `app/leaderboards/page.tsx`
- Create: `components/leaderboards.tsx`
- Modify: `components/prediction-room.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add pure deep-link tests before UI code**

Create a small exported `parseTradeAttribution(searchParams, market)` helper in `lib/attribution.ts`. Test valid direction/agent/signal, market mismatch, invalid IDs, and absent parameters before implementing it.

Run: `npx vitest run lib/attribution.test.ts`  
Expected: FAIL before the helper exists, then PASS after the minimal parser is added.

- [ ] **Step 2: Build `/agents`**

Use the existing injected wallet pattern. The page requests a challenge, signs the exact server message with `personal_sign`, registers the agent, and displays the raw API key in a one-time reveal panel with Copy and Download `.env` actions. Never persist the raw key to localStorage.

Fields are name, description, framework, BTC/ETH checkboxes, revisions toggle, and optional minimum confidence. Include a copyable curl example that references `DREAMPULSE_AGENT_KEY`, never interpolates the raw key into a URL.

- [ ] **Step 3: Build `/leaderboards`**

Fetch both public routes. Render `Predictors` and `Traders` tabs, type badges, eligibility text, sample size, accuracy/streak, PnL/ROI/fills/volume, loading state, empty state, degraded reconciliation notice, and explorer evidence links.

- [ ] **Step 4: Add agent signals to the room**

Fetch public effective signals for the live market. Show agent name, `AGENT` badge, direction, optional confidence, sanitized reason, last revision time, settled accuracy/sample, and `Follow signal`. Selecting it changes direction and records agent/signal attribution in component state; it does not trade.

On initial load, parse the canonical deep link and preselect only when its market matches the current room. Display “Signal from <agent>; review before signing.”

- [ ] **Step 5: Add navigation and focused CSS**

Add `Live Room`, `Agents`, and `Leaderboards` links. Reuse existing colors and typography. Add no component library and no animation dependency.

- [ ] **Step 6: Verify and commit**

Run: `npm test && npm run typecheck && npm run build`  
Expected: all PASS.

Use `agent-browser` to verify `/`, `/agents`, and `/leaderboards`: meaningful content, no Next error overlay, accessible buttons/inputs, and mobile width 390 px without horizontal overflow.

```bash
git add app/agents app/leaderboards components/agent-console.tsx components/leaderboards.tsx components/prediction-room.tsx app/page.tsx app/globals.css lib/attribution.ts lib/attribution.test.ts
git commit -m "feat: add agent onboarding and dual leaderboards"
```

### Task 8: Publish the integration contract and run the demo proof

**Files:**
- Create: `docs/agent-api.md`
- Modify: `README.md`
- Modify: `docs/operations.md`

- [ ] **Step 1: Document the generic agent flow**

Write exact curl commands for challenge, signed registration response, live market, signal PUT, performance, key rotation, and revocation. Include the error envelope and all stable codes. Add short Hermes/OpenClaw notes that both call the same REST contract and keep their own channel credentials.

- [ ] **Step 2: Document operations and recovery**

Add database backup, key compromise rotation, agent revocation, reconciliation degradation, rate-limit tuning, and testnet demo prerequisites. State that SQLite is single-instance and Postgres is the upgrade when horizontal deployment is required.

- [ ] **Step 3: Run the full verification suite**

```bash
npm test
npm run typecheck
npm run build
npm audit --audit-level=high
git diff --check
```

Expected: all tests pass, production build succeeds, zero high vulnerabilities, and no whitespace errors.

- [ ] **Step 4: Run an end-to-end testnet demo**

Register one agent with a test wallet; confirm the raw key is displayed once; submit a live signal with curl; verify it appears in the room; open its trade URL; sign a one-contract DreamDEX order; verify the fill endpoint accepts the receipt; confirm agent attribution and trading row; then use a settled fixture or real settled market to confirm prediction ranking.

Never record or commit the wallet private key, raw agent key, or Telegram/model credentials.

- [ ] **Step 5: Commit documentation**

```bash
git add docs/agent-api.md README.md docs/operations.md
git commit -m "docs: publish DreamPulse agent integration"
```

## Completion gate

The feature is complete only when:

- the full verification commands pass;
- the production server passes browser verification;
- an external curl client can register and submit a signal;
- a real DreamDEX fill can be attributed without trusting client-supplied quantity or price;
- human, agent, and host identities are visibly distinct;
- prediction and trading boards explain eligibility and evidence;
- the worktree is clean and every logical batch is committed.
