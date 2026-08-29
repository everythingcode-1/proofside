# DreamPulse Reactive Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn DreamPulse into a resilient, persistent, real-time hackathon release while preserving wallet-owned execution and authoritative DreamDEX settlement.

**Architecture:** Keep one Next.js service. Use the existing DreamDEX SDK for browser order-book watches and server reconciliation, Node 22's built-in SQLite for persistence, small pure state modules for freshness/transactions, and native route handlers for health and protected room writes.

**Tech Stack:** Next.js 16, React 19, TypeScript, viem, `@somnia-chain/markets-sdk`, Node `node:sqlite`, Vitest.

---

### Task 1: Add tested freshness and transaction state

**Files:**
- Create: `lib/realtime.ts`
- Create: `lib/realtime.test.ts`
- Create: `lib/transactions.ts`
- Create: `lib/transactions.test.ts`

- [ ] Write failing tests for live/reconnecting/stale/offline classification, capped reconnect delay, and legal transaction transitions.
- [ ] Run `npm test -- lib/realtime.test.ts lib/transactions.test.ts` and confirm failure.
- [ ] Implement pure functions with exhaustive unions and rejected illegal transitions.
- [ ] Run the focused tests and confirm pass.

Freshness rules: connected plus verified within 10s is `LIVE`; disconnected with healthy snapshot is `POLLING`; disconnected while retrying is `RECONNECTING`; over 20s is `STALE`; no snapshot is `OFFLINE`. Backoff is `min(15_000, 1000 * 2^attempt)`.

### Task 2: Add browser order-book subscription

**Files:**
- Modify: `lib/dreamdex.ts`
- Modify: `components/prediction-room.tsx`

- [ ] Export `watchMarketBook(market, onUpdate, onState)` using a read-only `SomniaMarkets` and repeated `watchOrderBook` calls.
- [ ] Stop and close the exchange when the component changes market or unmounts.
- [ ] Reconcile `/api/market` every 15 seconds and immediately after each watch update.
- [ ] Display `LIVE`, `POLLING`, `RECONNECTING`, `STALE`, or `OFFLINE`, plus last verified time.
- [ ] Disable trading in stale/offline state.
- [ ] Run test, typecheck, and build.

### Task 3: Replace memory room store with built-in SQLite

**Files:**
- Replace: `lib/room-store.ts`
- Modify: `lib/room-store.test.ts`
- Create: `lib/db.ts`
- Modify: `.gitignore`

- [ ] Write a persistence test that closes and reopens a temporary database and retains a wallet's replaced conviction.
- [ ] Create the SQLite schema with bound statements and WAL mode.
- [ ] Preserve the current `getRoom`, `setConviction`, and `clearRooms` interfaces.
- [ ] Add transition and transaction tables and repository functions.
- [ ] Ignore `data/*.sqlite*` while retaining `data/.gitkeep`.
- [ ] Run focused persistence tests and typecheck.

### Task 4: Add lifecycle recording and rollover feedback

**Files:**
- Modify: `app/api/market/route.ts`
- Modify: `lib/room-store.ts`
- Modify: `components/prediction-room.tsx`

- [ ] Reconcile each returned market phase against its last stored phase and record transitions once.
- [ ] Return recent transitions with the market snapshot.
- [ ] Detect a changed `marketId` client-side, preserve the prior ID, and show a host rollover notice.
- [ ] Keep room identity keyed only by `marketId`.
- [ ] Run tests, typecheck, and build.

### Task 5: Harden writes and diagnostics

**Files:**
- Create: `lib/rate-limit.ts`
- Create: `lib/rate-limit.test.ts`
- Modify: `app/api/rooms/[roomId]/route.ts`
- Create: `app/api/health/route.ts`
- Modify: `next.config.ts`

- [ ] Test a fixed-window rate limiter and reset behavior.
- [ ] Limit conviction writes per IP, reject bodies over 2KB, and retain strict address/direction validation.
- [ ] Add `/api/health` with RPC latest block, DreamDEX market state, latency, and 200/207/503 classification.
- [ ] Add security headers through `next.config.ts`.
- [ ] Ensure diagnostics expose no secrets.
- [ ] Run tests, typecheck, build, and audit.

### Task 6: Mature wallet preflight and proof states

**Files:**
- Modify: `lib/dreamdex.ts`
- Modify: `components/prediction-room.tsx`
- Modify: `lib/types.ts`

- [ ] Read gas balance before an order and block a zero-balance wallet.
- [ ] Refresh authoritative status and quote immediately before signature.
- [ ] Represent `PREFLIGHT`, `AWAITING_SIGNATURE`, `SUBMITTED`, `CONFIRMED`, `REVERTED`, `CANCELLED`, and `UNKNOWN` separately.
- [ ] Never call a transaction a fill unless the SDK supplies fill evidence.
- [ ] Associate a confirmed transaction with the persistent room repository.
- [ ] Preserve form input after rejection.
- [ ] Run all automated gates.

### Task 7: Add operator documentation and final verification

**Files:**
- Modify: `README.md`
- Create: `docs/operations.md`
- Create: `data/.gitkeep`

- [ ] Document persistent storage, health states, reconnect behavior, recovery, and demo prerequisites.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build`, and `npm audit --audit-level=high`.
- [ ] Start the server and verify `/`, `/api/market`, `/api/health`, room persistence after restart, and live freshness behavior.
- [ ] Commit each coherent implementation batch and leave the worktree clean.

## Completion Gate

- Real DreamDEX market reads succeed or fail honestly.
- Order-book changes reach the room through SDK watch, with 15-second reconciliation fallback.
- Freshness is visible and stale state disables trading.
- Convictions survive restart.
- Market transitions are recorded once and rollover is visible.
- Health reports RPC/indexer/market status without secrets.
- Transaction submission, confirmation, revert, cancellation, and unknown states remain distinct.
- Tests, typecheck, build, audit, and smoke checks pass.
