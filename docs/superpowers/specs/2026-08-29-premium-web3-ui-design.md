# DreamPulse Premium Web3 UI Design

## Thesis

DreamPulse is a calm, premium Web3 trading room: soft charcoal surfaces, generous whitespace, smooth 16–24 px cards, and restrained semantic color. Motion communicates continuity from market to proof without turning the product into a spectacle.

## Measured reference DNA

- Background `#171918` (96.71% coverage)
- Primary text `#f9f9f9`
- Secondary text `#8c8c8c` and `#bcbcbc`
- Structural neutral `#434444`
- Green reference accent `#119a6f`

DreamPulse retains its own cyan, coral, and amber semantics rather than copying the reference brand.

## System

- Background: `#0d0f0f`; surfaces `#151817` and `#1a1d1c`.
- Radius: 12 px controls, 18 px secondary cards, 24 px primary cards, 999 px only for status/button capsules.
- Borders: low-contrast 1 px neutral; no hard grid lines across the entire page.
- Typography: humanist sans for interface and display; monospace only for hashes, prices, timestamps, and network evidence.
- Motion: premium 180/280/400 ms with `cubic-bezier(.22,1,.36,1)`; transform and opacity only; reduced-motion mandatory.
- Effects: subtle radial color bloom and sparse star texture. No WebGL, canvas, glass blur, or particle runtime.

## Section requirements

- Header: floating rounded navigation shell, clear active links, compact Somnia network capsule.
- Hero: centered, compact, one product statement and one factual supporting paragraph.
- Telemetry: separate rounded cards for network, market verification, execution state, and proof readiness.
- Pulse rail: embedded in a soft rounded surface with quiet progress color.
- Market: a primary rounded card containing meta, question, line, odds, rule, signals, and social conviction.
- Odds: colorful cyan/coral surfaces with strong contrast, smooth hover, and obvious selected state.
- Market rule: neutral supporting panel, not an alert.
- Agent signals: compact rounded rows with direction/confidence hierarchy.
- Social conviction: demoted supporting metric.
- Position: separate sticky rounded card with shares, risk, portfolio disclosure, faucet secondary action, and dominant trade action.
- Transaction and proof: progressive disclosure; no empty evidence rows.
- Loading/error: centered rounded state card using the same system.
- Agents page: same header, hero, form surfaces, controls, key reveal, and code block language.
- Footer: one quiet rounded attribution row without repeated marketing copy.
- Responsive: no overflow at 390 px; one-column cards; minimum 44 px targets.

## Constraints

- Preserve every existing market, wallet, faucet, trade, signal, and proof behavior.
- Do not add animation or UI dependencies.
- Do not copy Stargate identity, logo, wording, or exact layout.
- Do not display fabricated network performance metrics.
