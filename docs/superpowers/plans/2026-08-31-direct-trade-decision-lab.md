# Direct Trade + Decision Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make direct DreamDEX UP/DOWN execution the primary right-column workflow and move human–agent analysis plus receipt creation into an optional section below it.

**Architecture:** Extract the order controls from `PredictionRoom` into a stateless `TradeTicket` with a narrow prop interface and server-rendered component tests. Keep market/realtime/transaction orchestration in `PredictionRoom`. Convert `ForecastComposer` into a controlled optional Decision Lab, and only mount receipt UI after a receipt exists.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, React DOM server rendering, DreamDEX Markets SDK, viem, existing CSS design system.

---

### Task 1: Extract and test the direct DreamDEX order ticket

**Files:**
- Create: `components/trade-ticket.tsx`
- Create: `components/trade-ticket.test.tsx`
- Modify: `components/prediction-room.tsx`

- [ ] **Step 1: Write the failing public component test**

Create `components/trade-ticket.test.tsx` with two server-rendering cases. The first passes `wallet={null}` and asserts that `▲ UP`, `▼ DOWN`, both prices, `Maximum loss`, and the disabled trade action are present without any Decision Lab state. The second passes a wallet and asserts that `Trade DOWN on DreamDEX` is enabled.

```tsx
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { TradeTicket } from "./trade-ticket"

const baseProps = {
  wallet: null,
  direction: "UP" as const,
  upPrice: 0.72,
  downPrice: 0.28,
  shares: "2",
  maxLoss: 1.44,
  collateralCode: "tUSDC",
  portfolio: null,
  marketLive: true,
  executionBlocked: false,
  tradePending: false,
  tradeMessage: "Connect wallet from the navbar to execute.",
  tradeState: "IDLE",
  tradeProof: null,
  activities: [],
  marketId: "0xmarket",
  contractAddress: "0xpool",
  onDirectionChange: vi.fn(),
  onSharesChange: vi.fn(),
  onAddConviction: vi.fn(),
  onTrade: vi.fn(),
}

describe("TradeTicket", () => {
  it("shows executable choices and risk before wallet connection", () => {
    const html = renderToStaticMarkup(<TradeTicket {...baseProps} />)
    expect(html).toContain("▲ UP")
    expect(html).toContain("▼ DOWN")
    expect(html).toContain("72¢")
    expect(html).toContain("28¢")
    expect(html).toContain("Maximum loss")
    expect(html).not.toContain("Decide before the crowd")
  })

  it("enables the selected trade path without a receipt", () => {
    const html = renderToStaticMarkup(<TradeTicket {...baseProps} wallet="0x1234567890123456789012345678901234567890" direction="DOWN" />)
    expect(html).toContain("Trade DOWN on DreamDEX")
    expect(html).not.toContain("disabled=\"\"")
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- components/trade-ticket.test.tsx`

Expected: FAIL because `components/trade-ticket.tsx` does not exist.

- [ ] **Step 3: Implement the stateless order ticket**

Create `TradeTicket` with explicit props for wallet, direction, prices, amount, maximum loss, portfolio, market safety state, transaction state, proof, and callbacks. Render in this order:

```tsx
<aside className="trade-ticket action-panel" aria-label="DreamDEX order ticket">
  <div className="source-heading">
    <span className="source-label dreamdex">DreamDEX execution</span>
    <span>{wallet ? short(wallet) : "View market · wallet optional"}</span>
  </div>
  <h3>Choose a side.</h3>
  <div className="odds-grid">{/* always-visible UP and DOWN buttons */}</div>
  <label htmlFor="shares">Contracts</label>
  <div className="amount-input">{/* controlled share amount */}</div>
  <div className="risk-box">{/* live price, maximum loss, IOC */}</div>
  {/* compact portfolio, secondary conviction, primary trade, message, proof */}
</aside>
```

Use existing `probabilityLabel`, `PortfolioView`, `TradeProof`, and transaction-state vocabulary. Disable the primary trade button only when wallet is absent, the market is not live, authoritative data is stale/offline, or a transaction is pending. Do not accept any receipt or analysis prop.

- [ ] **Step 4: Wire the ticket into `PredictionRoom`**

Import `TradeTicket`, move the existing position/risk/portfolio/trade/proof JSX into it, and pass the existing state and callbacks. Keep `trade`, `submitConviction`, and `refreshPortfolio` in `PredictionRoom`.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `npm test -- components/trade-ticket.test.tsx && npm run typecheck`

Expected: 2 component tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit**

```bash
git add components/trade-ticket.tsx components/trade-ticket.test.tsx components/prediction-room.tsx
git commit -m "feat: add direct DreamDEX trade ticket"
```

### Task 2: Make Decision Lab explicitly optional

**Files:**
- Modify: `components/forecast-composer.tsx`
- Modify: `components/prediction-room.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add the controlled Decision Lab interface**

Extend `ForecastComposerProps` with:

```ts
open: boolean
onOpenChange: (open: boolean) => void
```

When closed, render only a full-width quiet launcher:

```tsx
<section className="decision-lab-launcher" id="decision-lab">
  <div>
    <p className="source-label dreampulse">Optional Decision Lab</p>
    <h3>Challenge your read before or after you trade.</h3>
    <p>Compare what changed with attributed agent evidence, then preserve the reasoning only if it helps.</p>
  </div>
  <button className="secondary-button" onClick={() => onOpenChange(true)}>Open Decision Lab</button>
</section>
```

When open, retain the existing private-first/reveal/receipt workflow, rename the heading to `Test your judgment with evidence.`, and add a `Close Decision Lab` control that calls `onOpenChange(false)`. Closing must not publish, trade, or change the parent order amount.

- [ ] **Step 2: Remove analysis gates from the market workspace**

In `PredictionRoom`, remove conditional odds rendering, `consensus-lock`, `execution-lock`, and `market-handoff`. Remove copy saying `Hidden until first judgment`. Render `TradeTicket` beside `market-panel` and place `ForecastComposer` after that grid.

Use parent state:

```ts
const [decisionLabOpen, setDecisionLabOpen] = useState(false)
```

`analysisRevealed` remains an internal decision-analysis signal for baseline and receipt behavior, but it must not appear in trade enablement conditions.

- [ ] **Step 3: Restyle the hierarchy**

Update CSS so `.forecast-workspace` uses `minmax(0,1.35fr) minmax(340px,.65fr)`, `.trade-ticket` is sticky only on desktop, and `.decision-lab-launcher` spans the page below with a restrained border and compact height. Delete `.consensus-lock`, `.execution-lock`, `.market-handoff`, and obsolete `.post-forecast-grid` rules.

At `max-width:900px`, stack market, ticket, and Decision Lab in that order. At `max-width:700px`, keep both direction buttons at least 112px high and all controls at least 44px.

- [ ] **Step 4: Run component and existing UI-domain tests**

Run: `npm test -- components/trade-ticket.test.tsx lib/pulse-ui.test.ts lib/decision-brief.test.ts && npm run typecheck`

Expected: all focused tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add components/forecast-composer.tsx components/prediction-room.tsx app/globals.css
git commit -m "feat: move analysis into optional decision lab"
```

### Task 3: Remove empty receipt chrome and preserve rollover isolation

**Files:**
- Modify: `components/prediction-room.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Render receipts only after creation**

Replace the always-present receipt placeholder with:

```tsx
{createdReceipt && (
  <section className="created-receipt" aria-live="polite">
    <div className="section-title compact-title">
      <p className="eyebrow">Decision memory</p>
      <h2>Your reasoning is now verifiable.</h2>
    </div>
    <ReceiptCard receipt={createdReceipt} />
  </section>
)}
```

Remove `receipt-placeholder`, `receipt-stage`, and related empty-grid CSS.

- [ ] **Step 2: Keep optional state isolated during rollover**

In the existing market-ID change branch, also call `setDecisionLabOpen(false)` and keep the existing resets for signals, attribution, analysis, baseline, and receipt. Do not reset `shares`; this preserves the user's sizing preference while clearing stale market-specific reasoning.

- [ ] **Step 3: Verify full regression suite**

Run: `npm test && npm run typecheck && npm run build`

Expected: all 24+ test files PASS, TypeScript exits 0, and Next.js production build completes successfully.

- [ ] **Step 4: Commit**

```bash
git add components/prediction-room.tsx app/globals.css
git commit -m "fix: render decision receipts only when created"
```

### Task 4: Validate the user journey in the local production app

**Files:**
- Modify only if a verified visual or interaction defect is found: `components/trade-ticket.tsx`, `components/forecast-composer.tsx`, `components/prediction-room.tsx`, `app/globals.css`

- [ ] **Step 1: Restart the production server safely**

Resolve the exact listener on port 3000, verify its command line points to `.worktrees/dreampulse-mvp`, stop that PID, then run `npm run start` hidden from the same worktree.

- [ ] **Step 2: Verify the default desktop journey**

At `http://localhost:3000/`, verify:

- canonical market and chart are left;
- UP/DOWN prices, amount, maximum loss, and trade action are right;
- odds are visible without wallet and without opening Decision Lab;
- no locked card, hidden-odds message, forecast form, or empty receipt card appears;
- the Decision Lab launcher is below the trading workspace.

- [ ] **Step 3: Verify optional analysis**

Open Decision Lab, reveal analysis, change final direction, close it, and verify the order ticket remains usable and preserves the selected contract amount. Do not submit a wallet signature during this visual check.

- [ ] **Step 4: Verify responsive behavior**

At a 390px viewport, verify the order is market → trade ticket → Decision Lab; `document.documentElement.scrollWidth <= innerWidth`; direction buttons and primary actions remain legible and at least 44px tall.

- [ ] **Step 5: Final verification and commit if needed**

If Task 4 required fixes, run `npm test && npm run typecheck && npm run build`, then commit only those verified fixes:

```bash
git add components/trade-ticket.tsx components/forecast-composer.tsx components/prediction-room.tsx app/globals.css
git commit -m "fix: polish direct trade workspace"
```
