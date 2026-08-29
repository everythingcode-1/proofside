# DreamPulse Hybrid Forecast Receipts

**Date:** 2026-08-30  
**Status:** Approved design

## 1. Objective

Reposition DreamPulse from a social prediction room with trading into an open credibility layer for human and AI forecasts. A forecast becomes a signed, independently verifiable receipt tied to a DreamDEX Event Contract. DreamDEX remains the execution and settlement authority; Somnia provides public timestamp and integrity proof.

The product's primary loop is:

```text
identity -> forecast receipt -> Somnia proof -> DreamDEX resolution -> calibration credential
```

Discovery, discussion, and trading support this loop. They are not the product's core claim.

## 2. Product principles

- Humans and agents use the same receipt schema and scoring rules.
- Confidence is explicit and evaluated, not treated as decorative metadata.
- Every published version remains auditable.
- No receipt is described as immutable until its canonical hash is anchored on Somnia.
- A DreamDEX position can prove economic backing but is not required to publish a forecast.
- Reputation reflects calibration over a meaningful sample, not one lucky result or raw PnL.
- AI improves argument quality and falsifiability; it does not silently make financial decisions for users.

## 3. Hybrid architecture

DreamPulse stores the complete receipt off-chain in its existing SQLite application database. A minimal `ForecastRegistry` contract stores only the canonical receipt hash and essential provenance on Somnia Shannon Testnet.

```text
Human wallet / external agent
          |
          | create structured forecast
          v
DreamPulse receipt service
  - validates schema and market lock
  - canonicalizes content
  - verifies creator authorization
  - stores the complete receipt
          |
          | receipt hash
          v
Somnia ForecastRegistry
  - creator
  - receipt hash
  - market ID hash
  - previous receipt hash
  - block timestamp
          |
          | optional wallet-signed order
          v
DreamDEX Event Contract
  - execution
  - market outcome
          |
          v
DreamPulse settlement + calibration engine
```

The application never claims that its database alone provides immutability. A receipt progresses through explicit proof states: `DRAFT`, `SIGNED`, `ANCHORING`, `ANCHORED`, `RESOLVED`, or `VOID`.

## 4. Canonical Forecast Receipt

### 4.1 Fields

Each receipt contains:

- `schemaVersion`;
- `receiptId`;
- `creatorType`: `HUMAN` or `AGENT`;
- `creatorId`;
- `creatorWallet`;
- `marketId` and `marketIdHash`;
- `direction`: `UP` or `DOWN`;
- `confidenceBps`: integer from `100` through `9900`;
- `thesis`: plain text, maximum 560 characters;
- `counterCase`: plain text, maximum 280 characters;
- `invalidationCondition`: plain text, maximum 280 characters;
- `createdAt` and authoritative `locksAt` in Unix milliseconds;
- `revision` and optional `previousReceiptHash`;
- optional `backingTransactionHash`;
- `canonicalHash`;
- creator authorization evidence;
- Somnia anchor transaction and block metadata when anchored;
- resolution and score metadata after settlement.

Confidence excludes 0% and 100%. This prevents claims of impossible certainty and keeps Brier scoring meaningful.

### 4.2 Canonicalization and hash

The canonical payload contains only stable forecast fields. Runtime status, database IDs, transaction confirmation metadata, market outcomes, and calculated scores are excluded. Fields are serialized in a fixed documented order with normalized wallet addresses, market IDs, line endings, and Unicode before hashing with `keccak256`.

The backend and public verifier use the same pure canonicalization library. Any modification to thesis, confidence, creator, market, direction, timing, or revision linkage produces a different hash.

### 4.3 Authorization

Humans sign typed receipt data with their connected EVM wallet. External agents authenticate through the existing scoped API-key protocol; the registered owner wallet is recorded as the controlling identity. The first release anchors agent receipts through the DreamPulse relayer and identifies both the agent and its owner in the stored receipt.

An API key proves authority to publish for a registered agent but is never included in a receipt or public response.

## 5. Revisions and market locking

Published receipts are never updated in place. A revision creates a new receipt whose `previousReceiptHash` points to the preceding version. The full chain remains visible.

Only the latest valid anchored receipt created before the authoritative DreamDEX lock time is the effective forecast for scoring. Anchor confirmation must occur before lock. A submission that begins before lock but confirms afterward is preserved as evidence but marked `LATE` and excluded from scoring.

This strict confirmation rule prevents the application clock or a delayed relayer from creating ambiguous eligibility.

## 6. Minimal Somnia contract

`ForecastRegistry` exposes an append-only anchor operation and lookup events. It stores or emits:

```solidity
receiptHash
creator
marketIdHash
previousReceiptHash
block.timestamp
```

The contract rejects a zero hash and duplicate receipt hash. It does not store thesis text, custody assets, execute trades, resolve markets, or calculate reputation. Authorization permits a configured DreamPulse relayer to anchor both human-signed and authenticated agent receipts. Human signatures are verified by the application before relay and remain available through the public verifier.

Deployment configuration includes chain ID `50312`, registry address, relayer address, and explorer base URL. Missing registry or relayer configuration disables publication with a clear error; it must not silently fall back to a false immutable state.

## 7. DreamDEX relationship

Every receipt binds to an authoritative DreamDEX Event Contract market. Market availability, lock time, status, and outcome are read through the existing DreamDEX SDK integration.

A creator or follower may optionally back a forecast with a wallet-signed DreamDEX IOC order. Backing is displayed only after the existing proof path verifies the Somnia transaction and DreamDEX execution. Transaction confirmation alone is not presented as a fill.

Forecast quality and trading performance remain separate:

- calibration evaluates probabilistic judgment;
- DreamDEX backing proves economic commitment;
- trading PnL evaluates executed positions.

## 8. Resolution and calibration

Only authoritative settled DreamDEX markets contribute to reputation. Void markets remain visible but do not affect scores.

For an UP forecast:

```text
p = confidenceBps / 10000
o = 1 when outcome is UP, otherwise 0
brier = (p - o)^2
```

For DOWN, `p` represents the declared probability that DOWN occurs and `o` is defined accordingly. Lower Brier score is better.

Each creator profile exposes:

- total published receipts;
- anchored receipts;
- settled forecasts;
- accuracy;
- mean Brier score;
- expected calibration error across fixed confidence buckets;
- bucket accuracy and sample size;
- current streak;
- backed forecast rate;
- revision rate;
- status: `UNPROVEN` or `RANKED`.

At least five settled forecasts are required for `RANKED`. Rankings use mean Brier score ascending, then settled sample size descending, then expected calibration error ascending. Accuracy is informative and does not lead ranking.

## 9. User experience

### 9.1 Navigation

The primary navigation becomes:

- **Forecasts** — discover current and recently resolved receipts;
- **Create** — human forecast composer;
- **Agents** — registration, keys, policy, and API integration;
- **Reputation** — calibration leaderboard and creator profiles;
- **Verify** — public receipt verification.

### 9.2 Receipt-first market experience

The existing live market remains useful, but its hierarchy changes:

1. forecast claim and creator identity;
2. declared confidence;
3. thesis, counter-case, and invalidation condition;
4. receipt proof state and Somnia anchor;
5. creator calibration context;
6. optional DreamDEX backing action;
7. social room conviction as secondary context.

### 9.3 Composer

The composer selects a live DreamDEX market and requires direction, confidence, thesis, counter-case, and invalidation condition. Before signature it shows an immutable-publication review state, the market lock countdown, and the exact payload being signed. After signing, it shows anchor progress and does not represent the receipt as published until confirmation.

### 9.4 Verification

A receipt detail page and `/verify` flow show:

- whether the stored content recomputes to the claimed hash;
- creator authorization status;
- Somnia transaction, contract, block, and timestamp;
- DreamDEX market binding and resolution;
- revision chain;
- backing proof when present;
- score calculation after resolution.

## 10. API surface

```text
POST /api/forecasts/challenge
POST /api/forecasts
GET  /api/forecasts/:id
GET  /api/receipts/:hash/verify
GET  /api/creators/:id/calibration
GET  /api/leaderboards/calibration?type=ALL|HUMAN|AGENT
PUT  /api/agent/forecasts/:marketId
```

`POST /api/forecasts` accepts the signed human payload, verifies it, stores it, and submits its hash to the registry. `PUT /api/agent/forecasts/:marketId` uses existing bearer authentication and the same canonical receipt service.

Existing agent signal endpoints remain operational during the first migration. New agent integrations use the receipt endpoint. Signal responses may link to their corresponding receipt when one exists.

## 11. Data model

New tables extend the existing SQLite database.

### `forecast_receipts`

`id`, `schema_version`, `creator_type`, `creator_id`, `creator_wallet`, `market_id`, `market_id_hash`, `direction`, `confidence_bps`, `thesis`, `counter_case`, `invalidation_condition`, `created_at`, `locks_at`, `revision`, `previous_receipt_hash`, `canonical_hash`, `authorization_type`, `authorization_value`, `proof_state`, `anchor_tx_hash`, `anchor_block`, `anchored_at`, `backing_tx_hash`.

`canonical_hash` is unique. `(market_id, creator_type, creator_id, revision)` is unique.

### `forecast_resolutions`

`receipt_hash`, `outcome`, `status`, `resolved_at`, `brier_score`, `scored_at`.

Agent and wallet identities continue to use the existing `agents`, `agent_keys`, and wallet-address conventions. Existing `prediction_events` remain available for compatibility but are no longer the canonical credibility record.

## 12. Failure handling

- DreamDEX unavailable: reject creation before signing when market authority cannot be confirmed.
- Wallet signature rejected or invalid: keep local form state; create no receipt.
- Anchor transaction rejected: keep a `SIGNED` receipt with a retry action and no immutable claim.
- Anchor pending: show `ANCHORING`; prevent duplicate submission by canonical hash.
- Confirmation after lock: mark `LATE`; exclude from scoring.
- Database content/hash mismatch: verification fails loudly with `CONTENT_MISMATCH`.
- Registry mismatch: verification fails with `ANCHOR_MISMATCH`.
- Unknown or unresolved outcome: do not calculate a score.
- Void outcome: set `VOID`; exclude from aggregate reputation.

All APIs return stable error codes, human-readable messages, and a `retryable` flag.

## 13. Security and integrity

- Human signatures bind chain ID, application domain, creator wallet, canonical hash, market, and lock time.
- Agent API keys remain hashed at rest, scoped, revocable, and rate-limited.
- The server re-reads DreamDEX market state before accepting a receipt.
- Canonicalization is deterministic and covered by fixed test vectors.
- Database text is untrusted, length-limited, and escaped in the UI.
- Duplicate hashes and revision forks are rejected.
- The relayer key exists only in server environment configuration and is never returned to clients.
- Verification reads both application data and Somnia state.
- No receipt action connects a wallet, signs, anchors, or trades without an explicit user action.

## 14. Testing and acceptance

Automated tests must cover:

- canonical hash stability and mutation sensitivity;
- human signature verification and signer mismatch;
- agent authorization and owner identity binding;
- confidence and content constraints;
- revision linkage and fork rejection;
- authoritative lock checks and late confirmation;
- duplicate anchor idempotency;
- proof-state transitions;
- registry event decoding and verification;
- DreamDEX resolution and void handling;
- Brier score, confidence buckets, expected calibration error, ranking, and `UNPROVEN` status;
- content, anchor, and market mismatch detection;
- legacy signal compatibility;
- responsive composer, receipt, profile, leaderboard, and verifier flows.

The hackathon demo is complete when:

1. a human signs and anchors a 72% forecast;
2. a generic external agent publishes an opposing forecast through its API key;
3. both receipts verify against Somnia and bind to the same DreamDEX market;
4. a user optionally backs one forecast through the existing wallet-signed trade flow;
5. DreamDEX resolution updates both receipt outcomes and calibration metrics;
6. the public verifier explains every proof and scoring step.

## 15. Delivery boundary

The first implementation includes canonical receipt infrastructure, human and agent publication, minimal registry contract and deployment path, verification, resolution, calibration profiles and leaderboard, receipt-first UI, and linkage to existing DreamDEX execution.

Comments, likes, follows, copy trading, autonomous execution, tokens, Telegram adapters, hosted models, decentralized content storage, multi-chain markets, and non-DreamDEX settlement are roadmap items.

