# Forecast-First Market Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-column market-and-forecast workspace that preserves DreamDEX's canonical rule, labels every data authority, and places optional economic backing below the signed forecast.

**Architecture:** `PredictionRoom` remains the owner of live market, room, stream, wallet, and trading state. It composes a controlled `ForecastComposer` beside its market panel and lifts the created receipt through `onReceipt`, allowing the receipt and backing panel to appear together below without a second market request. A small provenance module owns non-authoritative explanatory copy so canonical DreamDEX text is never paraphrased.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, DreamDEX Markets SDK, viem, Recharts, Vitest, CSS.

---

## File map

- Create `lib/market-provenance.ts`: safe DreamPulse interpretation text that never rewrites the settlement rule.
- Create `lib/market-provenance.test.ts`: regression coverage for canonical-source separation.
- Modify `components/forecast-composer.tsx`: accept the authoritative market from the workspace and emit created receipts.
- Modify `components/prediction-room.tsx`: compose the market, forecast, receipt, and backing areas with explicit source labels.
- Modify `app/page.tsx`: remove the duplicate standalone composer and use the unified workspace.
- Modify `app/globals.css`: responsive market-left/forecast-right and receipt-left/backing-right layout.

### Task 1: Lock source-safe interpretation copy

**Files:**
- Create: `lib/market-provenance.ts`
- Create: `lib/market-provenance.test.ts`

- [ ] **Step 1: Write the failing provenance tests**

```ts
import { describe, expect, it } from "vitest"
import { dreamPulseInterpretation } from "./market-provenance"

describe("market provenance", () => {
  it("reports pricing and social context without rewriting the canonical rule", () => {
    const text = dreamPulseInterpretation({ upPrice: 0.03 }, { upPercent: 50 })
    expect(text).toBe("DreamDEX currently prices UP at 3¢. DreamPulse social conviction is 50% UP.")
    expect(text).not.toMatch(/finish|above|below|opening price/i)
  })

  it("remains honest when the order book has no quote", () => {
    expect(dreamPulseInterpretation({ upPrice: null }, { upPercent: 50 }))
      .toBe("DreamDEX has no executable UP quote in the current snapshot. DreamPulse social conviction is 50% UP.")
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- lib/market-provenance.test.ts`

Expected: FAIL because `market-provenance.ts` does not exist.

- [ ] **Step 3: Implement the source-safe helper**

```ts
import { probabilityLabel } from "./format"

export function dreamPulseInterpretation(
  market: { upPrice: number | null },
  room: { upPercent: number },
) {
  const marketText = market.upPrice === null
    ? "DreamDEX has no executable UP quote in the current snapshot."
    : `DreamDEX currently prices UP at ${probabilityLabel(market.upPrice)}.`
  return `${marketText} DreamPulse social conviction is ${room.upPercent}% UP.`
}
```

- [ ] **Step 4: Run the test and commit**

Run: `npm test -- lib/market-provenance.test.ts`

Expected: 2 tests PASS.

```bash
git add lib/market-provenance.ts lib/market-provenance.test.ts
git commit -m "test: protect canonical DreamDEX market wording"
```

### Task 2: Make the forecast composer controlled by the live workspace

**Files:**
- Modify: `components/forecast-composer.tsx`

- [ ] **Step 1: Replace internal market loading with explicit props**

Use this public contract:

```ts
type ForecastComposerProps = {
  market: MarketView
  onReceipt?: (receipt: StoredForecast) => void
}

export function ForecastComposer({ market, onReceipt }: ForecastComposerProps) {
```

Remove the internal `market` state and `/api/market` effect. After publication, keep `setReceipt(result.receipt)` and add:

```ts
onReceipt?.(result.receipt)
```

- [ ] **Step 2: Make the composer a single compact forecast card**

Replace the nested intro/form split with one section:

```tsx
<section className="forecast-card" id="create" aria-labelledby="forecast-heading">
  <div className="forecast-card-head">
    <p className="source-label dreampulse">DreamPulse forecast receipt</p>
    <h2 id="forecast-heading">Make your judgment accountable.</h2>
    <p>Confidence is scored after DreamDEX settlement. Trading remains optional.</p>
  </div>
  <div className="composer-form">
    <div className="composer-market">
      <span>DreamDEX canonical market</span>
      <strong>{market.question}</strong>
    </div>
    <div className="composer-direction">Render the existing UP and DOWN buttons with their selected classes and handlers.</div>
  </div>
</section>
```

After the market block, move the existing confidence range, thesis textarea, counter-case textarea, invalidation textarea, publish button, live message, and receipt link into this `.composer-form` in their current order. Keep the existing wallet signing, challenge, anchoring, validation, and error functions unchanged.

- [ ] **Step 3: Verify types and commit**

Run: `npm run typecheck`

Expected: the home page fails until Task 3 updates the call site; do not commit a broken tree. Complete Tasks 2 and 3 together before the commit.

### Task 3: Compose market-left, forecast-right, then receipt-and-backing

**Files:**
- Modify: `components/prediction-room.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Lift the created receipt into `PredictionRoom`**

Add imports and state:

```ts
import { ForecastComposer } from "@/components/forecast-composer"
import { ReceiptCard } from "@/components/receipt-card"
import type { StoredForecast } from "@/lib/forecast-store"
import { dreamPulseInterpretation } from "@/lib/market-provenance"

const [createdReceipt, setCreatedReceipt] = useState<StoredForecast | null>(null)
```

- [ ] **Step 2: Replace generated market-rule copy with provenance-safe copy**

For a live market, compute:

```ts
const interpretation = dreamPulseInterpretation(market, room)
```

Keep `resultSummary` for settled markets and the explicit void message. Remove the `openingSummary` import and never present generated text under `MARKET RULE`.

- [ ] **Step 3: Build the primary workspace**

Wrap the market panel and composer with:

```tsx
<div className="forecast-workspace">
  <section className="market-panel" aria-labelledby="canonical-market-question">
    <div className="source-heading">
      <span className="source-label dreamdex">DreamDEX canonical rule</span>
      <span>{market.asset} · {durationLabel(market.durationSec)} · closes in {countdownLabel(market.locksAt, now)}</span>
    </div>
    <h2 id="canonical-market-question">{market.question}</h2>
    <div className="line-row"><span>Opening reference</span><strong>{market.strike}</strong></div>
    <div className="source-divider"><span className="source-label somnia">Somnia oracle data</span><small>BTC/USDC or ETH/USDC live reference</small></div>
    <MarketOracleChart market={market} />
    <div className="source-divider"><span className="source-label dreamdex">DreamDEX order book</span><small>Executable market probability</small></div>
    <div className="odds-grid">Move the existing UP and DOWN order-book buttons here without changing their handlers.</div>
    <div className="host-note"><small>DreamPulse interpretation</small><p>{interpretation}</p></div>
    <div className="signal-list">Move the existing agent-signal list here and label it DreamPulse agent signals.</div>
    <div className="crowd-card">Move the existing conviction bar here and label it DreamPulse social signal.</div>
  </section>
  <ForecastComposer market={market} onReceipt={setCreatedReceipt} />
</div>
```

- [ ] **Step 4: Build the lower row**

Move the existing action panel outside the market panel into:

```tsx
<div className="post-forecast-grid">
  <section className="receipt-stage" aria-live="polite">
    {createdReceipt
      ? <ReceiptCard receipt={createdReceipt} />
      : <div className="receipt-placeholder"><span className="source-label dreampulse">Verifiable receipt</span><h3>Your signed forecast appears here.</h3><p>Publish without trading; economic backing remains optional.</p></div>}
  </section>
  <aside className="action-panel" aria-label="Optional DreamDEX economic backing">
    <p className="source-label dreamdex">Optional DreamDEX backing</p>
    <div className="direction-review">Move the existing selected direction review here.</div>
    <div className="amount-input">Move the existing share input here.</div>
    <div className="risk-box">Move the existing live price, maximum loss, and IOC execution rows here.</div>
    <div className="backing-actions">Move the existing wallet, conviction, faucet, trade, message, portfolio, and proof controls here in their current order.</div>
  </aside>
</div>
```

- [ ] **Step 5: Simplify the home page**

Remove the `ForecastComposer` import and standalone `<ForecastComposer />`. Replace the execution section heading and room with:

```tsx
<section className="execution-section">
  <div className="section-title">
    <p className="eyebrow">Live forecast workspace</p>
    <h2>Read the market. Record your reasoning.</h2>
    <p>DreamDEX defines the market. DreamPulse records your judgment. Somnia makes the proof inspectable.</p>
  </div>
  <PredictionRoom />
</section>
```

- [ ] **Step 6: Verify and commit Tasks 2–3**

Run: `npm run typecheck`

Expected: PASS.

```bash
git add components/forecast-composer.tsx components/prediction-room.tsx app/page.tsx
git commit -m "feat: compose forecast-first live market workspace"
```

### Task 4: Implement responsive visual hierarchy

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add source badges and the desktop grids**

```css
.forecast-workspace{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(340px,.65fr);gap:14px;align-items:start}
.forecast-card{position:sticky;top:94px;border:1px solid var(--border);border-radius:var(--radius-lg);background:linear-gradient(145deg,rgba(28,29,44,.72),rgba(8,9,12,.94));overflow:hidden}
.forecast-card-head{padding:26px 26px 8px}.forecast-card-head h2{margin:12px 0;font-size:30px;letter-spacing:-.04em}.forecast-card-head p:last-child{color:var(--muted);line-height:1.55}
.source-heading,.source-divider{display:flex;align-items:center;justify-content:space-between;gap:12px}.source-label{display:inline-flex;align-items:center;gap:7px;color:var(--muted);font:800 8px/1 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase}.source-label::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 12px currentColor}.source-label.dreamdex{color:var(--blue-soft)}.source-label.somnia{color:var(--green)}.source-label.dreampulse{color:#d6b479}
.post-forecast-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.62fr);gap:14px;align-items:start;margin-top:14px}.receipt-stage,.receipt-placeholder{min-height:260px}.receipt-placeholder{display:grid;align-content:center;padding:34px;border:1px dashed var(--border-strong);border-radius:var(--radius-lg);background:rgba(255,255,255,.018)}
```

- [ ] **Step 2: Add tablet and mobile stacking**

```css
@media(max-width:900px){.forecast-workspace,.post-forecast-grid{grid-template-columns:1fr}.forecast-card{position:static}.post-forecast-grid{display:flex;flex-direction:column}.receipt-stage{order:1}.action-panel{order:2}}
@media(max-width:700px){.source-heading,.source-divider{align-items:flex-start;flex-direction:column}.forecast-card-head{padding:22px 17px 6px}.receipt-placeholder{min-height:210px;padding:24px 18px}}
```

- [ ] **Step 3: Run design audit checks**

Run:

```bash
rg -n "outline:\s*(none|0)" app components
rg -n "onClick" app components -g "*.tsx"
rg -n "prefers-reduced-motion" app/globals.css
```

Expected: no unhandled outline removal, interactive controls use semantic buttons/anchors, and reduced-motion handling exists.

- [ ] **Step 4: Commit styling**

```bash
git add app/globals.css
git commit -m "style: clarify market and forecast provenance"
```

### Task 5: Full verification and production restart

**Files:**
- Verify only.

- [ ] **Step 1: Run the complete verification suite**

Run:

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all tests PASS, typecheck PASS, Next production build PASS, and no whitespace errors.

- [ ] **Step 2: Restart the explicit port-3000 listener**

Resolve the exact listener with `Get-NetTCPConnection -LocalPort 3000 -State Listen`, stop only that PID, and start `npm run start` from this worktree.

- [ ] **Step 3: Verify public routes and authority labels**

Request `/`, `/agents`, `/reputation`, and `/verify`. Expect HTTP 200. Confirm the home HTML includes `DreamDEX canonical rule`, `Somnia oracle data`, and `DreamPulse forecast receipt`, and does not include the old `MARKET RULE` label.

- [ ] **Step 4: Confirm clean repository state**

Run: `git status --short`

Expected: no output.
