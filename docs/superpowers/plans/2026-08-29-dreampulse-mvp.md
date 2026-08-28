# DreamPulse MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a testnet-ready DreamPulse web application that discovers a live DreamDEX Event Contract, hosts a social prediction room, lets a browser wallet submit a DreamDEX order, and reacts to authoritative settlement.

**Architecture:** One Next.js application contains the client UI and minimal route handlers. A server-side DreamDEX adapter supplies normalized live market data; a browser-side adapter creates an injected-wallet `SomniaMarkets` instance for signed orders. A small in-memory room store and deterministic host engine provide the social and agentic lifecycle without custom contracts or additional infrastructure.

**Tech Stack:** Next.js 15, React 19, TypeScript, viem, `@somnia-chain/markets-sdk`, Vitest, native CSS.

---

## File Map

- `app/page.tsx` — server entry that renders the application shell.
- `app/globals.css` — complete responsive visual system.
- `app/api/market/route.ts` — current market snapshot endpoint.
- `app/api/rooms/[roomId]/route.ts` — conviction read/write endpoint.
- `components/prediction-room.tsx` — interactive room, wallet, and trade flow.
- `lib/config.ts` — Somnia/DreamDEX network configuration.
- `lib/types.ts` — stable application types.
- `lib/dreamdex.ts` — market discovery, normalization, and browser exchange creation.
- `lib/lifecycle.ts` — authoritative market-status mapping and host summaries.
- `lib/room-store.ts` — minimal in-memory conviction aggregation.
- `lib/format.ts` — bigint-safe display helpers.
- `lib/*.test.ts` — focused logic checks.
- `.env.example` — optional endpoint and venue overrides.
- `README.md` — setup, limitations, and demo instructions.

### Task 1: Scaffold the single application

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `.gitignore`

- [ ] **Step 1: Create the package manifest**

Use one runtime SDK and one chain library; do not add wagmi, a component library, a database, or an agent framework.

```json
{
  "name": "dreampulse",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@somnia-chain/markets-sdk": "0.28.1",
    "next": "15.5.2",
    "react": "19.1.1",
    "react-dom": "19.1.1",
    "viem": "^2.37.3"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Add standard Next.js TypeScript configuration and root layout**

The layout imports `app/globals.css`, sets DreamPulse metadata, and renders children. The config uses defaults; no experimental flags.

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: a generated `package-lock.json` and zero install errors.

- [ ] **Step 4: Verify the empty shell**

Run: `npm run typecheck`

Expected: PASS with no TypeScript diagnostics.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts app/layout.tsx .gitignore
git commit -m "chore: scaffold DreamPulse app"
```

### Task 2: Define market types and lifecycle rules

**Files:**
- Create: `lib/types.ts`
- Create: `lib/lifecycle.ts`
- Test: `lib/lifecycle.test.ts`

- [ ] **Step 1: Write lifecycle tests**

```ts
import { describe, expect, it } from "vitest"
import { phaseFromStatus, openingSummary, resultSummary } from "./lifecycle"

describe("DreamPulse lifecycle", () => {
  it("maps DreamDEX statuses without guessing settlement", () => {
    expect([0, 1, 2, 3, 4, 5].map(phaseFromStatus)).toEqual([
      "OPENING", "LIVE", "LOCKED", "SETTLING", "SETTLED", "VOID",
    ])
  })

  it("creates factual host copy", () => {
    expect(openingSummary({ asset: "BTC", strike: "$61,046", up: "54%", crowd: "63%" }))
      .toContain("BTC")
    expect(resultSummary({ asset: "BTC", outcome: "UP", crowdWon: 63 }))
      .toContain("63%")
  })
})
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- lib/lifecycle.test.ts`

Expected: FAIL because lifecycle functions do not exist.

- [ ] **Step 3: Implement stable types and deterministic lifecycle copy**

`lib/types.ts` defines `MarketPhase`, `Direction`, `MarketView`, `RoomState`, and `TradeProof`. `lib/lifecycle.ts` maps only statuses 0–5 and throws on unknown status. Summary functions interpolate supplied facts and contain no price prediction.

- [ ] **Step 4: Verify lifecycle behavior**

Run: `npm test -- lib/lifecycle.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/lifecycle.ts lib/lifecycle.test.ts
git commit -m "feat: define prediction room lifecycle"
```

### Task 3: Build the DreamDEX read adapter

**Files:**
- Create: `lib/config.ts`
- Create: `lib/format.ts`
- Create: `lib/dreamdex.ts`
- Create: `app/api/market/route.ts`
- Test: `lib/format.test.ts`
- Create: `.env.example`

- [ ] **Step 1: Write bigint display tests**

```ts
import { describe, expect, it } from "vitest"
import { formatUnitsSafe, formatProbability } from "./format"

describe("integer-safe formatting", () => {
  it("formats testnet collateral and probabilities", () => {
    expect(formatUnitsSafe(61_046_000000n, 6, 2)).toBe("61,046.00")
    expect(formatProbability(540_000n, 6)).toBe("54%")
  })
})
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- lib/format.test.ts`

Expected: FAIL because formatting helpers do not exist.

- [ ] **Step 3: Add explicit testnet configuration**

Use chain ID `50312`, RPC `https://api.infra.testnet.somnia.network`, WebSocket `wss://api.infra.testnet.somnia.network/ws`, indexer `https://dev.smk.somnia.host/v1/graphql`, DreamDEX venue ID `0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c`, and the current Bot Kit deployment addresses. Every value accepts an environment override because venues and deployment addresses can move.

- [ ] **Step 4: Implement market discovery**

Create a read-only `SomniaMarkets`, call `loadMarkets(true)`, filter active binary markets to the configured venue, choose the earliest-expiring BTC/ETH market, call `getMarketOnchain(marketId)`, and read the YES order book. Normalize it to `MarketView` while preserving raw numeric strings for money values.

Rules:

- key by `marketId`, never pool address;
- use onchain status as authority;
- read `strike` and `intervalSec`, never parse question copy;
- close the SDK connection in `finally`;
- return a structured unavailable response if no market exists.

- [ ] **Step 5: Expose the snapshot route**

`GET /api/market` returns `{ market, fetchedAt }` with `Cache-Control: no-store`. Errors return status 503 and `{ error, fetchedAt }`.

- [ ] **Step 6: Verify formatter and live adapter**

Run: `npm test -- lib/format.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/config.ts lib/format.ts lib/dreamdex.ts app/api/market/route.ts lib/format.test.ts .env.example
git commit -m "feat: read DreamDEX event contracts"
```

### Task 4: Add the minimal social room store

**Files:**
- Create: `lib/room-store.ts`
- Create: `app/api/rooms/[roomId]/route.ts`
- Test: `lib/room-store.test.ts`

- [ ] **Step 1: Write aggregation tests**

```ts
import { beforeEach, describe, expect, it } from "vitest"
import { clearRooms, getRoom, setConviction } from "./room-store"

describe("room convictions", () => {
  beforeEach(clearRooms)

  it("keeps one replaceable conviction per wallet", () => {
    setConviction("room-1", "0x0000000000000000000000000000000000000001", "UP")
    setConviction("room-1", "0x0000000000000000000000000000000000000001", "DOWN")
    expect(getRoom("room-1")).toMatchObject({ participants: 1, up: 0, down: 1 })
  })
})
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- lib/room-store.test.ts`

Expected: FAIL because room-store does not exist.

- [ ] **Step 3: Implement the store**

Use a module-level `Map<roomId, Map<wallet, conviction>>`. Normalize wallets to lowercase. Add a `ponytail:` comment documenting that this single-process store is for the hackathon demo and should become durable storage only when multi-instance deployment is required.

- [ ] **Step 4: Implement the room route**

- `GET` returns aggregate counts and percentages.
- `POST` accepts `{ wallet, direction }`.
- Validate wallet with `isAddress` and direction against `UP | DOWN`.
- Reject conviction updates for a room whose current market is no longer LIVE.

- [ ] **Step 5: Verify**

Run: `npm test -- lib/room-store.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/room-store.ts lib/room-store.test.ts app/api/rooms
git commit -m "feat: add social conviction rooms"
```

### Task 5: Create the prediction-room interface

**Files:**
- Create: `app/page.tsx`
- Create: `components/prediction-room.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Build the server entry**

Render the brand header, concise product statement, `PredictionRoom`, and a footer identifying Somnia testnet and DreamDEX execution.

- [ ] **Step 2: Build the client room state**

The client fetches `/api/market` immediately and every five seconds. It fetches the matching room aggregate after each market refresh. The visible states are loading, unavailable, live, locked/settling, settled, and void.

- [ ] **Step 3: Build the room UI**

The single-page composition contains:

- autonomous host status ribbon;
- asset, duration, line, and countdown;
- UP/DOWN price cards;
- room conviction split;
- direction selector and stake input;
- transaction review and action area;
- proof panel;
- settlement recap.

Use semantic buttons, labels, focus styles, text labels in addition to color, and `aria-live="polite"` only for transaction state—not the countdown.

- [ ] **Step 4: Add responsive native CSS**

Use no component or chart dependency. Create a dark, high-contrast trading-room visual language with an amber agent accent, cyan UP state, coral DOWN state, tabular numeric typography, subtle grid texture, and mobile-first stacking. Honor `prefers-reduced-motion`.

- [ ] **Step 5: Verify**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS and Next.js emits the page and API routes.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/globals.css components/prediction-room.tsx
git commit -m "feat: create autonomous prediction room UI"
```

### Task 6: Add injected-wallet DreamDEX trading

**Files:**
- Modify: `lib/dreamdex.ts`
- Modify: `components/prediction-room.tsx`
- Test: `lib/format.test.ts`

- [ ] **Step 1: Add exact order quantization tests**

Extend `lib/format.test.ts` with raw tick/lot quantization cases. The helper must reject zero, negative, and off-grid results instead of passing floating-point values to the SDK.

- [ ] **Step 2: Run the new test and verify failure**

Run: `npm test -- lib/format.test.ts`

Expected: FAIL because the order helper does not exist.

- [ ] **Step 3: Create the browser exchange**

Use `createWalletClient({ transport: custom(window.ethereum) })`, request addresses, switch or add Somnia testnet, and create `SomniaMarkets` with `walletClient`. Do not request a private key.

- [ ] **Step 4: Submit a deliberate IOC order**

Before submitting:

- refresh the market;
- call `getMarketOnchain(marketId)`;
- require status `Trading`;
- enforce time headroom;
- fetch the selected outcome book;
- derive a crossing limit from the top resting quote;
- quantize price and size in integer units;
- use IOC so no invisible remainder rests;
- check the returned receipt status because SDK writes may resolve after a revert.

If funding or approval is required, expose the exact SDK/transaction error rather than attempting custody or a hidden server-side signer.

- [ ] **Step 5: Connect trade results to the room**

On success, show the hash and Somnia explorer link, then POST the conviction with the transaction hash. On rejection or failure, preserve direction and stake.

- [ ] **Step 6: Verify**

Run: `npm test`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/dreamdex.ts lib/format.ts lib/format.test.ts components/prediction-room.tsx
git commit -m "feat: submit wallet-signed DreamDEX orders"
```

### Task 7: Document and verify the demo

**Files:**
- Create: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Document setup and truth boundaries**

README must include:

- `npm install` and `npm run dev`;
- Somnia testnet wallet requirement;
- test collateral and gas prerequisites;
- environment overrides;
- the difference between room conviction and verified trade;
- in-memory room-store limitation;
- no-custody statement;
- live integration failure behavior;
- 2–3 minute demo flow.

- [ ] **Step 2: Run the full automated gate**

Run: `npm test && npm run typecheck && npm run build`

Expected: all tests pass, no type errors, production build succeeds.

- [ ] **Step 3: Run the application and smoke-test routes**

Run: `npm run dev`

Verify:

- `/` renders;
- `/api/market` returns a live market or an honest 503 unavailable payload;
- wallet connect requests Somnia testnet;
- conviction selection updates the room;
- no order is represented as successful without a transaction hash;
- settled/void state cannot be manually guessed by the client.

- [ ] **Step 4: Commit**

```bash
git add README.md .env.example
git commit -m "docs: add DreamPulse demo guide"
```

## Completion Gate

Before claiming completion:

1. `git status --short` is clean.
2. `npm test` passes.
3. `npm run typecheck` passes.
4. `npm run build` passes.
5. The market API either proves a live DreamDEX integration or explicitly reports why no live market is available.
6. The UI never presents social conviction as an executed trade.
7. A successful trade is accompanied by an actual Somnia transaction hash.
