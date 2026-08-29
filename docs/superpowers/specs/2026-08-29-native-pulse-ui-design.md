# DreamPulse Native-first Pulse UI Design

## Goal

Make DreamPulse feel visibly fast, live, and trustworthy while reducing visual noise. Motion must explain the path from DreamDEX market data through Somnia confirmation, not decorate the page.

## Interaction thesis

DreamPulse communicates Somnia speed through immediate state feedback, a continuous visual pulse from market signal to wallet execution, and compact on-chain proof. Frequent interactions finish in 100–250 ms; no routine UI animation exceeds 500 ms.

## Design DNA

### Design system

- Surface: deep ink with restrained cyan data accents, amber decision accents, and coral risk accents.
- Typography: large editorial headline only in the hero; compact sans-serif for interface text; monospace only for prices, latency, hashes, and network evidence.
- Spacing: 8 px base rhythm, fewer nested boxes, and one dominant room container.
- Shape: sharp 2–6 px radii. Pills are limited to status and identity badges.
- Elevation: borders and controlled luminance replace heavy shadows and glass effects.
- Motion tokens: 100 ms quick, 180 ms standard, 280 ms reveal; signature easing `cubic-bezier(0.2, 0, 0, 1)`.

### Design style

- Mood: precise, energetic, infrastructural.
- Composition: one clear left-to-right decision flow: market context → signal → position → signature → proof.
- Brand voice: factual and terse. Avoid inflated claims such as “instant” unless measured.
- Density: operational rather than decorative. Each visible element must explain the market, enable an action, or prove execution.

### Visual effects

- Lightweight tier only: CSS transforms, opacity, gradients, and SVG.
- No WebGL, Canvas particle field, custom cursor, blur-heavy glassmorphism, or perpetual large-area animation.
- A single Pulse Rail visually connects market, agent signal, wallet, and on-chain confirmation.
- Ambient motion is limited to the live network indicator and rail; both stop under reduced-motion.

## Information architecture

### Header

Keep brand, Live Room, Agents, and network status. Remove redundant network text when the status component already communicates it.

### Hero

Replace the oversized generic marketing block with a compact product statement and a live Somnia telemetry strip. The strip shows network name, connection state, last verified time, and transaction state. It must not invent TPS or latency values.

### Prediction room

The market question, time remaining, UP/DOWN price, and line to beat remain primary. Host summary becomes a short market rule block. Social conviction is visually secondary because it is not a verified trade.

Agent signals become a compact list inside the market flow. Selecting a signal moves emphasis toward the position panel and displays attribution without initiating a transaction.

### Position panel

Show wallet, selected direction, shares, live price, maximum loss, execution method, and primary actions. Move wallet balances and held positions into one collapsible “Portfolio” disclosure. Hide empty activity history until an activity exists.

### Proof

Before execution, show a compact “Awaiting signed transaction” state rather than an empty definition list. After confirmation, reveal network, pool, transaction, and verified execution state with one short pulse-lock animation.

## Elements to remove or demote

- Remove decorative agent orb and generic “autonomous host” framing.
- Remove duplicated status labels and repeated DreamDEX/Somnia attribution inside the same viewport.
- Demote social vote details and explanatory caveats to compact supporting copy.
- Hide empty transaction/activity rows.
- Avoid showing full market identifiers unless requested through a disclosure or tooltip.
- Keep the tUSDC faucet action but visually separate it from the primary trade action.

## Motion choreography

1. Page entry: hero copy and telemetry enter with a 30 ms stagger, total under 280 ms.
2. Live data: changed price receives a 180 ms luminance pulse; unchanged data does not animate.
3. Signal selection: selected signal and direction card settle in 180 ms while Pulse Rail advances toward the position panel.
4. Transaction states: preflight, wallet signature, submission, and confirmation advance along the same rail. State changes use transform and opacity only.
5. Confirmation: proof panel enters once in 280 ms and stops. No celebration loop.
6. Reduced motion: all movement becomes immediate state/color changes; no pulse loop or scroll reveal.

## Technical approach

- Keep the current Next.js and React architecture.
- Add no animation dependency. Use CSS keyframes/transitions and native browser APIs only.
- Store motion values as CSS custom properties.
- Use existing React state for transaction and freshness changes; do not add animation state machines.
- Use `aria-live` for transactional text and `aria-hidden` for decorative rail elements.
- Animate only transform and opacity where possible.

## Responsive behavior

- Desktop retains the two-column decision flow.
- Below tablet width, the rail becomes vertical and the position panel follows market context.
- At 390 px, controls use full width, tap targets remain at least 44 px, and no horizontal overflow is permitted.

## Verification

- Existing functional tests, typecheck, and production build must remain green.
- Browser verification covers `/`, `/agents`, loading/error/live states, and 390 px viewport.
- Verify `prefers-reduced-motion`, keyboard focus, contrast, and absence of horizontal overflow.
- Confirm no invented performance metric is displayed; speed claims must be tied to observable state timestamps or transaction confirmation.

## Out of scope

- GSAP, Framer Motion, Lottie, WebGL, and canvas effects.
- New protocol, trading, leaderboard, or database features.
- Marketing claims about Somnia throughput not sourced from real measurements.
