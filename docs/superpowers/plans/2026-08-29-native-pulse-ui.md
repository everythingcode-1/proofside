# DreamPulse Native Pulse UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize and simplify DreamPulse while using native motion to make the live Somnia market-to-proof flow feel fast and coherent.

**Architecture:** Keep the existing Next.js client state and API contracts. Extract small presentational helpers only where they reduce the large room component, express all visual and motion tokens in global CSS, and use CSS transforms/opacity plus existing state attributes rather than a new animation runtime.

**Tech Stack:** Next.js 16, React 19, TypeScript, vanilla CSS, native SVG/CSS animation, Vitest.

---

## File map

- Create `lib/pulse-ui.ts` — pure mappings from connection/transaction state to user-facing pulse stages.
- Create `lib/pulse-ui.test.ts` — stage and claim-safety tests.
- Create `components/pulse-rail.tsx` — accessible, decorative-native signal-to-proof rail.
- Modify `components/prediction-room.tsx` — simplify hierarchy, remove redundant elements, and wire live state into the rail.
- Modify `app/page.tsx` — compact product hero and navigation.
- Modify `components/agent-console.tsx` — align onboarding with the same UI hierarchy.
- Modify `app/agents/page.tsx` — use the compact shell.
- Modify `app/globals.css` — Design DNA tokens, native motion, responsive layout, focus, and reduced-motion rules.

### Task 1: Define the pulse state model

**Files:**
- Create: `lib/pulse-ui.ts`
- Create: `lib/pulse-ui.test.ts`

- [ ] **Step 1: Write the failing state tests**

Test that `pulseStage("LIVE", "IDLE")` yields `MARKET`, awaiting signature yields `SIGNATURE`, submitted yields `SOMNIA`, confirmed yields `PROOF`, and blocked states yield `ATTENTION`. Test that `speedLabel(null)` returns `Live verification` and a measured duration returns a factual string such as `Verified in 1.24s`.

- [ ] **Step 2: Run the test to verify RED**

Run `npx vitest run lib/pulse-ui.test.ts`; expect module-not-found failure.

- [ ] **Step 3: Implement the pure mappings**

Export `PulseStage`, `pulseStage(freshness, transaction)`, and `speedLabel(elapsedMs)`. Never return unsourced TPS or latency. Clamp elapsed time to a non-negative finite number.

- [ ] **Step 4: Verify and commit**

Run `npx vitest run lib/pulse-ui.test.ts && npm run typecheck`; expect PASS. Commit as `feat: model native pulse states`.

### Task 2: Simplify the room and add the native Pulse Rail

**Files:**
- Create: `components/pulse-rail.tsx`
- Modify: `components/prediction-room.tsx`
- Modify: `app/page.tsx`
- Modify: `components/agent-console.tsx`
- Modify: `app/agents/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Build the semantic Pulse Rail**

Render four compact stages—Market, Signal, Somnia, Proof—with `data-active` and `data-complete`. Mark the animated connector `aria-hidden="true"`; expose one readable status sentence to assistive technology.

- [ ] **Step 2: Replace the generic hero**

Use one compact headline, one factual explanation, and a small telemetry row derived from actual connection/verification state. Do not display invented TPS, block time, or latency.

- [ ] **Step 3: Prune the room**

Remove the decorative agent orb, duplicate status copy, empty proof rows, and repeated attribution. Keep market rule, odds, agent signals, selected position, primary trade action, faucet as secondary action, and proof after a transaction exists. Put balances and held positions inside a native `<details>` disclosure.

- [ ] **Step 4: Apply the Design DNA**

Define CSS tokens `--motion-quick: 100ms`, `--motion-standard: 180ms`, `--motion-reveal: 280ms`, and `--ease-pulse: cubic-bezier(.2,0,0,1)`. Reduce nested borders, use 2–6 px radii, keep cyan/amber/coral semantic roles, and reserve monospace for evidence and market numbers.

- [ ] **Step 5: Add restrained native motion**

Animate only transform and opacity for entry/selection/proof. Use a short luminance pulse for changed prices and a single rail translation for state progress. No infinite animation except the small live network heartbeat. Add global `prefers-reduced-motion: reduce` rules that stop loops and set transition/animation durations to `0.01ms`.

- [ ] **Step 6: Align `/agents`**

Use the same shell, spacing, focus treatment, and compact evidence language. Preserve all registration behavior and the one-time API-key warning.

- [ ] **Step 7: Verify and commit**

Run `npm test && npm run typecheck && npm run build && git diff --check`; expect all commands to pass. Commit as `feat: introduce native pulse interface`.

### Task 3: Browser and design audit

**Files:**
- Modify only files from Task 2 when verification finds a concrete defect.

- [ ] **Step 1: Run desktop browser verification**

Open `/` and `/agents`. Confirm meaningful content, no error overlay, no console-breaking interaction, keyboard-visible focus, factual Somnia language, and a clear Market → Signal → Somnia → Proof flow.

- [ ] **Step 2: Run mobile verification**

Set viewport to 390 px. Confirm no horizontal overflow, at least 44 px interactive targets, vertical Pulse Rail, readable odds, and action buttons within the viewport.

- [ ] **Step 3: Verify reduced motion**

Emulate `prefers-reduced-motion: reduce`; confirm the rail, heartbeat, reveals, and price pulse stop while all states remain understandable.

- [ ] **Step 4: Run final checks and commit fixes**

Run `npm test && npm run typecheck && npm run build && git diff --check`; expect PASS and a clean worktree. If browser verification required changes, commit them as `fix: polish native pulse experience`.

## Completion gate

- The interface shows fewer elements and a clear decision hierarchy.
- Somnia speed is communicated through observable state transitions, never fabricated metrics.
- The Pulse Rail reflects live market and transaction state.
- No animation dependency is added.
- Reduced motion, keyboard focus, desktop, and 390 px layouts pass verification.
- Tests, typecheck, build, and whitespace checks pass.
