# DreamPulse Reactive Release Design

**Project:** DreamPulse  
**Release:** Reactive Hackathon Release  
**Date:** 29 August 2026  
**Base:** DreamPulse MVP on `codex/dreampulse-mvp`  
**Status:** Approved design amendment

## 1. Objective

Evolve DreamPulse from a working polling-based prototype into a production-shaped hackathon release that demonstrates Somnia-native real-time behavior, resilient DreamDEX integration, durable room state, autonomous market-to-market continuity, safe wallet execution, and repeatable operations.

The release targets a stable single-instance deployment suitable for judging and community demonstration. It is not a claim of audited mainnet financial infrastructure.

## 2. Maturity Definition

Maturity means the product behaves correctly through state changes and failures. It does not mean adding unrelated features.

The release must:

- receive live market updates and expose their freshness;
- reconcile live events against authoritative onchain state;
- recover from WebSocket, RPC, and indexer interruption;
- persist social room state across server restarts;
- move from one Event Contract to the next without operator intervention;
- distinguish conviction, submitted order, confirmed transaction, and fill;
- keep generated commentary outside financial state and execution;
- expose health and diagnostic information;
- pass repeatable automated and manual release gates.

## 3. Product Boundaries

### Included

- BTC and ETH DreamDEX Event Contracts on Somnia Shannon Testnet;
- one selected live room at a time;
- live market and order-book updates;
- server reconciliation fallback;
- persistent conviction and transaction association;
- deterministic host summaries with optional model enhancement;
- injected-wallet user-signed IOC orders;
- automatic room rollover and factual settlement recap;
- health, freshness, and diagnostic UI;
- deployment and demo runbooks.

### Excluded

- mainnet readiness claims;
- custody or delegated user wallets;
- autonomous trading with user funds;
- custom contracts;
- tokens, NFTs, rewards, or points;
- full chat and moderation;
- multi-agent debate;
- creator payouts;
- copy trading;
- generalized support for every DreamDEX market type;
- multi-region or multi-instance database coordination.

These exclusions are deliberate Ponytail/YAGNI decisions.

## 4. Runtime Architecture

```text
Browser
  - prediction room UI
  - injected wallet
  - DreamDEX browser exchange
  - live freshness state
       |
       +-- DreamDEX/Somnia WebSocket subscription
       |
       +-- HTTP reconciliation and room API
                     |
                     v
Next.js application server
  - authoritative market snapshot adapter
  - room lifecycle coordinator
  - durable SQLite room repository
  - optional host-language adapter
  - health and diagnostics
                     |
          +----------+----------+
          |                     |
    DreamDEX indexer       Somnia RPC/WS
```

The application remains a single deployable service. No queue, custom indexer, microservice, or general agent framework is introduced.

## 5. Live Data Contract

### 5.1 Two-layer update model

DreamPulse uses:

1. **Subscription layer** for low-latency order-book and chain updates.
2. **Reconciliation layer** for authoritative periodic snapshots.

WebSocket events trigger refreshes but do not independently declare final settlement. The current onchain market status remains authoritative.

### 5.2 Freshness states

The client exposes:

- `LIVE`: subscription connected and last verified update is within 10 seconds;
- `RECONNECTING`: subscription disconnected and reconnect attempts are active;
- `STALE`: no verified update for 20 seconds;
- `OFFLINE`: both subscription and reconciliation fail;
- `POLLING`: WebSocket unavailable but reconciliation remains healthy.

The UI displays the last verified timestamp. Stale data cannot be labeled live.

### 5.3 Reconnect policy

Reconnect uses bounded exponential backoff:

```text
1s -> 2s -> 4s -> 8s -> 15s maximum
```

Successful connection resets the delay. Reconnect state is visible and does not block wallet access to proof/history, but new trade submission is disabled when market freshness is stale.

### 5.4 Reconciliation

An authoritative market snapshot runs:

- immediately on page load;
- after a relevant subscription event;
- every 15 seconds as a safety net;
- immediately before order submission;
- after transaction confirmation;
- when the room reaches its local lock timestamp.

## 6. Autonomous Room Lifecycle

The lifecycle remains:

```text
OPENING -> LIVE -> LOCKED -> SETTLING -> SETTLED
                                      \-> VOID
```

The lifecycle coordinator records transitions with:

- room/market ID;
- prior state;
- next state;
- authoritative status code;
- transition timestamp;
- source (`snapshot`, `websocket`, or `transaction`);

### Rollover

After `SETTLED` or `VOID`:

1. preserve the room as a result view;
2. create a factual recap;
3. discover the earliest-expiring next live BTC/ETH contract;
4. show a next-room call to action;
5. switch automatically after a short visible countdown unless the user stays on the result view.

A change in pool address alone does not define a new room. Room identity is always the DreamDEX `marketId`.

## 7. Durable Room Repository

### 7.1 Storage choice

SQLite is used for the single-instance hackathon deployment. It provides restart durability without a managed database or ORM.

The repository boundary supports:

- `getRoom(marketId)`;
- `setConviction(marketId, wallet, direction, transactionHash?)`;
- `recordTransition(marketId, from, to, source, occurredAt)`;
- `getTransitions(marketId)`;
- `associateTransaction(marketId, wallet, hash, state)`.

### 7.2 Tables

```sql
CREATE TABLE convictions (
  market_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN')),
  transaction_hash TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (market_id, wallet)
);

CREATE TABLE transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_id TEXT NOT NULL,
  from_phase TEXT,
  to_phase TEXT NOT NULL,
  source TEXT NOT NULL,
  occurred_at INTEGER NOT NULL
);

CREATE TABLE transactions (
  hash TEXT PRIMARY KEY,
  market_id TEXT NOT NULL,
  wallet TEXT NOT NULL,
  direction TEXT NOT NULL,
  state TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

Wallet addresses and transaction hashes are normalized to lowercase. SQL parameters are always bound; request strings are never interpolated into SQL.

### 7.3 Deployment ceiling

SQLite is explicitly a single-instance solution. A multi-instance deployment must move the repository to Postgres before horizontal scaling.

## 8. Host Intelligence

The host engine has two layers:

1. deterministic facts and lifecycle decisions;
2. optional language generation.

Model input contains only:

- asset;
- question;
- duration;
- market prices;
- room conviction totals;
- lifecycle phase;
- final outcome when authoritative.

Model output is validated as a short plain-text summary. It cannot:

- change market state;
- initiate transactions;
- invent prices or participant counts;
- promise returns;
- present financial advice;
- infer settlement before DreamDEX resolves it.

When no model key exists or the request fails, deterministic templates render immediately. Trading never depends on model availability.

## 9. Trading Readiness

Before enabling order submission, the client verifies:

- injected wallet exists;
- wallet is on chain ID `50312`;
- market freshness is not stale;
- authoritative market status is `Trading`;
- at least 30 seconds remain;
- share amount is positive and finite;
- a resting quote exists;
- native STT gas balance is non-zero;
- collateral requirement can be calculated;
- transaction confirmation is not already pending.

The transaction state machine is:

```text
IDLE -> PREFLIGHT -> AWAITING_SIGNATURE -> SUBMITTED -> CONFIRMED
             \-> BLOCKED              \-> REVERTED
             \-> CANCELLED             \-> UNKNOWN
```

`SUBMITTED` is not labeled `CONFIRMED`. A transaction hash is displayed immediately after submission. Receipt status determines confirmation or revert. Fill state is displayed separately when it can be observed; a confirmed IOC transaction does not guarantee a fill.

## 10. Health and Diagnostics

`GET /api/health` returns:

- application status;
- Somnia RPC reachability and latest block;
- DreamDEX indexer reachability;
- configured and inferred venue;
- selected live market ID;
- current authoritative phase;
- snapshot latency;
- current timestamp.

The endpoint returns:

- HTTP 200 when core dependencies are healthy;
- HTTP 207 when degraded but reconciliation remains possible;
- HTTP 503 when no authoritative market read is possible.

No secret, private key, full environment dump, or wallet balance is exposed.

Server logs use consistent fields: timestamp, operation, market ID, duration, result, and safe error message.

## 11. API Protection

The conviction endpoint applies:

- request body size limit;
- strict wallet and direction validation;
- one current conviction per wallet and market;
- per-IP bounded rate limiting;
- rejection after room lock;
- no user-controlled HTML rendering.

Security headers include content-type protection, clickjacking protection, strict referrer policy, and a deployable Content Security Policy compatible with injected wallets.

## 12. Testing Strategy

### Unit tests

- lifecycle mapping and forbidden unknown states;
- freshness state calculation;
- reconnect backoff;
- countdown and probability formatting;
- room aggregation and wallet replacement;
- SQLite persistence after repository reopen;
- rate limiting;
- transaction-state transitions;
- deterministic host copy.

### Integration tests

- live market adapter returns a DreamDEX BTC/ETH market or an honest unavailable result;
- health endpoint classifies dependency failures;
- conviction survives server restart/repository reopen;
- locked rooms reject new conviction;
- stale freshness disables trade preparation.

### Manual release checks

- wallet network switching;
- rejected signature preserves form state;
- testnet IOC order produces a hash;
- transaction proof opens in Somnia Explorer;
- WebSocket interruption visibly enters reconnect/polling mode;
- restored connection returns to live state;
- settlement and next-room rollover complete without code changes.

## 13. Migration and Compatibility

Existing routes remain compatible:

- `GET /api/market` remains the authoritative snapshot route;
- `GET/POST /api/rooms/[roomId]` keep the current aggregate shape;
- new fields are additive;
- the browser can fall back to snapshot polling when subscription setup fails.

Existing in-memory conviction data is ephemeral and is not migrated. The SQLite database begins empty on first mature-release run.

## 14. Release Acceptance Criteria

The release is complete when:

1. live DreamDEX order-book changes reach the UI without waiting for the polling interval;
2. disconnect and reconnect states are visible and tested;
3. a 15-second reconciliation fallback corrects missed state;
4. room conviction survives process restart;
5. automatic room rollover detects the next `marketId`;
6. stale state disables new order submission;
7. wallet preflight identifies wrong network, missing gas, invalid size, and unavailable quote;
8. transaction states do not conflate submission, confirmation, and fill;
9. one real testnet DreamDEX transaction is captured as explorer proof;
10. settlement recap uses only authoritative outcome data;
11. `/api/health` reports dependency status without leaking secrets;
12. tests, typecheck, production build, and high-severity dependency audit pass;
13. setup, deployment, demo, and recovery procedures are documented;
14. the app remains usable without a model API key.

## 15. Delivery Sequence

1. Extract freshness and transaction state logic with tests.
2. Add live subscriptions and reconciliation.
3. Replace memory storage with SQLite repository.
4. Add lifecycle transition history and rollover.
5. Harden wallet preflight and transaction states.
6. Add health endpoint, rate limiting, and security headers.
7. Add optional host language adapter with deterministic fallback.
8. Run live integration, restart, reconnect, transaction, and settlement verification.
9. Update deployment and demo runbooks.

## 16. Final Release Statement

DreamPulse Reactive Release is a resilient, agent-operated distribution layer for DreamDEX Event Contracts. It uses subscriptions for immediacy, onchain reconciliation for correctness, durable social state for continuity, and wallet-owned execution for safety. Its maturity is demonstrated by recovery, observability, and repeatability—not by feature count.
