# DreamPulse Hybrid Receipt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working receipt-first vertical slice where humans and registered agents publish structured forecasts, verify their canonical proof, and receive transparent calibration metrics.

**Architecture:** Reuse the existing Next.js, SQLite, viem, DreamDEX market loader, wallet connection, and agent authentication. Add one pure receipt module, one focused SQLite store, a minimal event-based Somnia registry, thin API routes, and small UI surfaces. The application supports `SIGNED` receipts without mislabeling them; when registry configuration is present, the server relays the hash and promotes the receipt to `ANCHORED`.

**Tech Stack:** Next.js 16, React 19, TypeScript, viem, node:sqlite, Vitest, Solidity 0.8.24.

---

## Ponytail scope

This plan deliberately avoids a generalized reputation framework, background queue, ORM, contract framework, new component library, AI provider, and social feed. Lazy settlement uses existing stored DreamDEX results. A single receipt page provides creation, verification, and reputation evidence for the demo.

### Task 1: Canonical receipt and calibration domain

**Files:**
- Create: `lib/forecast-receipt.ts`
- Create: `lib/forecast-receipt.test.ts`
- Create: `lib/calibration.ts`
- Create: `lib/calibration.test.ts`

- [ ] **Step 1: Write failing canonicalization tests**

Cover fixed payload hashing, wallet/market normalization, mutation sensitivity, confidence bounds, text limits, and revision linkage. Use one fixed receipt fixture and assert that repeated hashing is identical while changing `confidenceBps` changes the hash.

- [ ] **Step 2: Run the tests and confirm failure**

Run: `npx vitest run lib/forecast-receipt.test.ts --maxWorkers=1`  
Expected: FAIL because `forecast-receipt.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure receipt module**

Export `ForecastInput`, `ForecastPayload`, `ForecastProofState`, `validateForecastInput`, `buildForecastPayload`, `canonicalForecastJson`, and `hashForecastPayload`. Use stable array-based serialization and viem `keccak256(toBytes(json))`; do not add a canonical-JSON dependency.

- [ ] **Step 4: Write failing calibration tests**

Test UP and DOWN Brier scores, mean Brier, accuracy, fixed 10-point confidence buckets, expected calibration error, five-result `RANKED` threshold, and ranking tie-break order.

- [ ] **Step 5: Implement the minimal calibration module**

Export `scoreForecast`, `buildCalibrationProfile`, and `rankCalibrationProfiles`. Derive metrics from settled receipt rows rather than persisting aggregate counters.

- [ ] **Step 6: Run focused tests and commit**

Run: `npx vitest run lib/forecast-receipt.test.ts lib/calibration.test.ts --maxWorkers=1`  
Expected: PASS.  
Commit: `feat: add forecast receipt domain`

### Task 2: Receipt persistence

**Files:**
- Modify: `lib/db.ts`
- Create: `lib/forecast-store.ts`
- Create: `lib/forecast-store.test.ts`

- [ ] **Step 1: Write failing store tests**

Use `:memory:` to prove insert/read by ID and hash, duplicate-hash rejection, append-only revisions, revision-fork rejection, proof-state transition, resolution storage, creator listing, and effective anchored receipt selection before lock.

- [ ] **Step 2: Run the store tests and confirm failure**

Run: `npx vitest run lib/forecast-store.test.ts --maxWorkers=1`  
Expected: FAIL because the store and tables do not exist.

- [ ] **Step 3: Add the two tables and focused store**

Add `forecast_receipts` and `forecast_resolutions` exactly as specified. Keep SQL and row mapping inside `forecast-store.ts`. Expose only `createReceipt`, `getById`, `getByHash`, `markAnchoring`, `markAnchored`, `markAnchorFailed`, `resolve`, `listByCreator`, `listForMarket`, and `listSettledByCreator`.

- [ ] **Step 4: Run tests and commit**

Run: `npx vitest run lib/forecast-store.test.ts --maxWorkers=1`  
Expected: PASS.  
Commit: `feat: persist hybrid forecast receipts`

### Task 3: Minimal Somnia anchor

**Files:**
- Create: `contracts/ForecastRegistry.sol`
- Create: `lib/forecast-registry.ts`
- Create: `lib/forecast-registry.test.ts`
- Create: `scripts/deploy-forecast-registry.mjs`
- Modify: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Write the minimal registry contract**

Implement an owner-configured relayer and one `anchor(bytes32 receiptHash,address creator,bytes32 marketIdHash,bytes32 previousReceiptHash)` function. Reject zero and duplicate receipt hashes, store `anchoredAt[receiptHash]`, and emit a `ForecastAnchored` event. The contract never holds funds.

- [ ] **Step 2: Write failing registry adapter tests**

Mock viem clients and verify disabled configuration, calldata arguments, receipt confirmation, event verification, duplicate idempotency, and explorer URL construction.

- [ ] **Step 3: Implement the viem adapter**

Use the existing viem dependency. Export `anchorForecast` and `verifyForecastAnchor`. Read `FORECAST_REGISTRY_ADDRESS` and `FORECAST_RELAYER_PRIVATE_KEY`; return a stable `REGISTRY_NOT_CONFIGURED` error if absent.

- [ ] **Step 4: Add a direct deployment script**

Compile the single contract with `solc`, deploy through viem using `SOMNIA_RPC_URL` and the relayer key, then print only the contract address and transaction hash. Add `solc` as a dev dependency and `contract:deploy` script.

- [ ] **Step 5: Run tests and commit**

Run: `npx vitest run lib/forecast-registry.test.ts --maxWorkers=1`  
Expected: PASS.  
Commit: `feat: anchor forecast hashes on Somnia`

### Task 4: Human and agent publication APIs

**Files:**
- Create: `lib/forecast-service.ts`
- Create: `lib/forecast-service.test.ts`
- Create: `app/api/forecasts/challenge/route.ts`
- Create: `app/api/forecasts/route.ts`
- Create: `app/api/forecasts/[id]/route.ts`
- Create: `app/api/receipts/[hash]/verify/route.ts`
- Create: `app/api/agent/forecasts/[marketId]/route.ts`
- Create: `app/api/creators/[id]/calibration/route.ts`
- Create: `app/api/leaderboards/calibration/route.ts`

- [ ] **Step 1: Write failing service tests**

Inject market loader, store, clock, signature verifier, and anchor adapter. Cover authoritative market mismatch, locked market, human signer mismatch, agent owner binding, validation errors, `SIGNED -> ANCHORING -> ANCHORED`, anchor failure remaining `SIGNED`, late confirmation becoming `LATE`, and idempotent canonical hash submission.

- [ ] **Step 2: Implement the receipt service**

Keep route handlers thin. The service validates market state, constructs and hashes the payload, verifies authorization, stores the receipt, calls the anchor adapter, and persists the resulting proof state. Reuse existing challenge storage and `authenticateAgent`.

- [ ] **Step 3: Add HTTP routes**

Human creation accepts an EIP-712 signature over the canonical hash and market lock. Agent creation accepts the existing bearer key and the same structured forecast fields. Verification recomputes the hash and checks registry evidence. Calibration endpoints derive scores only from authoritative stored resolutions.

- [ ] **Step 4: Run API and full domain tests**

Run: `npx vitest run lib/forecast-service.test.ts app/api/agents/agents.test.ts app/api/agent/signals/signals.test.ts --maxWorkers=1`  
Expected: PASS, including legacy agent endpoints.

- [ ] **Step 5: Commit**

Commit: `feat: publish and verify forecast receipts`

### Task 5: Receipt-first user experience

**Files:**
- Create: `components/forecast-composer.tsx`
- Create: `components/receipt-card.tsx`
- Create: `components/calibration-profile.tsx`
- Create: `app/forecasts/[id]/page.tsx`
- Create: `app/reputation/page.tsx`
- Create: `app/verify/page.tsx`
- Modify: `components/prediction-room.tsx`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add receipt-first page structure**

Place the composer and latest market receipts before room conviction and trade controls. Keep the existing premium Web3 design tokens. Add navigation for Forecasts, Agents, Reputation, and Verify without adding a routing abstraction.

- [ ] **Step 2: Implement explicit wallet publication**

The composer requires direction, confidence, thesis, counter-case, and invalidation condition. It displays the exact review payload, asks the connected wallet for `eth_signTypedData_v4`, posts the signature, and shows `SIGNED`, `ANCHORING`, `ANCHORED`, or `LATE` without conflating transaction confirmation with DreamDEX fill.

- [ ] **Step 3: Implement receipt, verification, and calibration views**

Show hash recomputation, authorization, Somnia anchor link, DreamDEX binding, revision chain, Brier calculation, sample status, and HUMAN/AGENT distinction. Keep all secondary details collapsible on mobile.

- [ ] **Step 4: Add small UI behavior tests**

Extend existing pure UI helpers to cover proof-state labels, ranking status, and confidence formatting; avoid introducing a browser test framework solely for this slice.

- [ ] **Step 5: Verify responsive behavior and commit**

Run: `npm test -- --maxWorkers=1`  
Run: `npm run typecheck`  
Run: `npm run build`  
Expected: all commands pass. Manually verify `/`, one receipt page, `/reputation`, and `/verify` at desktop and 390px widths.  
Commit: `feat: make forecast receipts the primary experience`

### Task 6: Deploy and prove the demo path

**Files:**
- Modify: `README.md`
- Modify: `docs/operations.md`

- [ ] **Step 1: Deploy the registry to Somnia Shannon**

Run: `npm run contract:deploy` with the configured relayer. Save `FORECAST_REGISTRY_ADDRESS` locally and confirm the explorer transaction succeeds.

- [ ] **Step 2: Exercise both creator paths**

Publish one wallet-signed human receipt and one API-authenticated agent receipt against the same live DreamDEX market. Verify both hashes through `/verify` and confirm their transaction links resolve on Shannon Explorer.

- [ ] **Step 3: Document exact setup and recovery**

Document environment variables, deployment, agent curl request, receipt publication, anchor retry, verification, and the honest distinction between `SIGNED`, `ANCHORED`, and DreamDEX-backed.

- [ ] **Step 4: Run final verification and commit**

Run: `npm test -- --maxWorkers=1 && npm run typecheck && npm run build`  
Expected: tests, types, and production build pass.  
Commit: `docs: document hybrid receipt operations`

