# Market-linked Oracle Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display a responsive BTC/ETH oracle-price chart linked to the active DreamDEX Event Contract.

**Architecture:** A focused server module reads M1 price candles through the already-installed DreamDEX SDK and normalizes them into a chart view. One API route validates the current market ID. A dependency-free React SVG component renders the view inside the existing market panel and refreshes with the current 15-second cadence.

**Tech Stack:** Next.js 16, React 19, TypeScript, `@somnia-chain/markets-sdk`, native SVG, Vitest.

---

### Task 1: Oracle chart domain and DreamDEX adapter

**Files:**
- Create: `lib/oracle-chart.ts`
- Create: `lib/oracle-chart.test.ts`
- Modify: `lib/dreamdex.ts`

- [ ] **Step 1: Write failing tests**

Test `buildOracleChartView(market, candles, now)` for BTC/ETH propagation, numeric strike, candle-derived opening, change values, invalid-row filtering, 120-second stale status, empty status, and 240-point cap.

- [ ] **Step 2: Verify RED**

Run `npx vitest run lib/oracle-chart.test.ts --maxWorkers=1`. Expect module-not-found failure.

- [ ] **Step 3: Implement pure normalization**

Create `OracleChartView`, `OracleChartPoint`, and `buildOracleChartView`. Filter non-finite OHLC values, sort by timestamp, retain the newest 240 points, and derive opening/current/change/freshness exactly as the design specifies.

- [ ] **Step 4: Add the SDK adapter**

Export `loadOracleChart(market, now)` from `lib/dreamdex.ts`. Reuse `createExchange()`, call `exchange.client.fetchPriceCandles(market.asset, "M1", { from: market.opensAt, to: Math.floor(now / 1000), limit: 240 })`, normalize, and close the exchange in `finally`.

- [ ] **Step 5: Verify GREEN and commit**

Run `npx vitest run lib/oracle-chart.test.ts --maxWorkers=1`; expect PASS. Commit `feat: read DreamDEX oracle chart data`.

### Task 2: Market-scoped chart API

**Files:**
- Create: `app/api/markets/[marketId]/chart/route.ts`
- Create: `app/api/markets/chart.test.ts`

- [ ] **Step 1: Write failing route tests**

Inject the existing market loader and a chart loader seam. Assert `200` for matching market, `404 MARKET_NOT_FOUND` for another ID, `503 DREAMDEX_UNAVAILABLE` when discovery fails, and `503 ORACLE_UNAVAILABLE` when price candles fail.

- [ ] **Step 2: Verify RED**

Run `npx vitest run app/api/markets/chart.test.ts --maxWorkers=1`; expect route/module failure.

- [ ] **Step 3: Implement the thin route**

Load the authoritative current market, compare IDs case-insensitively, call `loadOracleChart`, and return stable JSON envelopes with `Cache-Control: no-store`.

- [ ] **Step 4: Verify GREEN and commit**

Run `npx vitest run app/api/markets/chart.test.ts --maxWorkers=1`; expect PASS. Commit `feat: expose market oracle chart API`.

### Task 3: Native SVG market chart

**Files:**
- Create: `components/market-oracle-chart.tsx`
- Create: `lib/chart-geometry.ts`
- Create: `lib/chart-geometry.test.ts`
- Modify: `components/prediction-room.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing geometry tests**

Test `linePath(points, width, height, padding)` for an empty series, one point, flat series, changing series, and coordinates constrained inside the drawing area.

- [ ] **Step 2: Verify RED**

Run `npx vitest run lib/chart-geometry.test.ts --maxWorkers=1`; expect module-not-found failure.

- [ ] **Step 3: Implement geometry and component**

Use one SVG `path`, area fill, dashed opening line, semantic zones, source/freshness labels, accessible summary, fixed loading height, compact error state, and retry. Fetch `/api/markets/:marketId/chart` immediately and every 15 seconds; clear data when `marketId` changes.

- [ ] **Step 4: Place and style the chart**

Render after `.line-row` and before `.odds-grid`. Extend the existing premium rounded design without changing order controls. Ensure 390px layout has no horizontal overflow and reduced-motion remains respected.

- [ ] **Step 5: Full verification and commit**

Run `npm test -- --maxWorkers=1`, `npm run typecheck`, and `npm run build`; all must pass. Verify `/` and the chart API return `200`. Commit `feat: render live BTC and ETH oracle chart`.

