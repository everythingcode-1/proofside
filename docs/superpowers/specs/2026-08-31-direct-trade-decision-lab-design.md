# DreamPulse Direct Trade + Decision Lab

## Status and scope

This specification supersedes the interaction hierarchy in `2026-08-31-forecast-first-market-workspace-design.md`. It does not replace DreamPulse receipts, calibration, agent identity, or DreamDEX provenance. It changes when those capabilities appear and whether they block execution.

The home-page experience must let a user understand and trade a live DreamDEX Event Contract immediately. DreamPulse decision support remains the differentiator, but it is an optional enhancement rather than a mandatory form.

## Product promise

DreamPulse helps a user act quickly and improve the quality of that action:

1. See the authoritative DreamDEX market and Somnia oracle state.
2. Choose UP or DOWN and understand the exact exposure.
3. Optionally inspect what changed, agent support, and the strongest challenge.
4. Optionally sign a decision receipt and build a calibrated record.

The product must never imply that completing a forecast receipt is required to trade.

## Primary workspace

Desktop uses one compact two-column workspace.

### Left: market context

- Render the canonical `market.question` without paraphrasing it.
- Show opening reference, duration, countdown, and live BTC/USDC or ETH/USDC oracle chart.
- Label DreamDEX and Somnia sources explicitly.
- Keep the last valid snapshot visible while a new snapshot is loading or reconnecting.
- Avoid guidance copy that tells the user to complete another workflow before trading.

### Right: direct execution

The right column is a focused DreamDEX order ticket, not a forecast composer. It contains only information needed to decide and sign:

- UP and DOWN selectors with executable prices.
- Selected direction and live price.
- Contract/share amount.
- Maximum loss and execution type.
- Collateral balance and current UP/DOWN holdings in a compact disclosure.
- One primary `Trade {direction} on DreamDEX` action.
- One secondary `Add conviction only` action when applicable.
- Wallet readiness, transaction progress, and authoritative onchain proof.

UP and DOWN prices are visible before wallet connection and before any DreamPulse analysis. Connecting a wallet only enables signing and execution. Stale or offline authoritative data may disable execution, but never redirects the user into the Decision Lab.

## Optional Decision Lab

The human–agent decision workflow moves below the primary workspace and is visually secondary. Its collapsed entry point explains one benefit in plain language: compare an independent view with agent evidence and preserve the reasoning.

Opening the lab reveals:

- Optional private first view and confidence.
- What changed since the user opened the room.
- Authenticated supporting and opposing agent claims.
- Strongest counter-case and invalidation trigger.
- Optional final direction revision.
- Optional wallet-signed decision receipt.

The lab must offer a clear skip/close path. Leaving it unopened or incomplete never blocks UP/DOWN selection, position sizing, or trading. If the user signs a receipt, the resulting receipt appears directly below the lab without reserving empty space beforehand.

## Human and agent roles

- **Human:** chooses risk, direction, whether to inspect analysis, and whether to sign or trade.
- **Agent:** monitors changes, supplies attributed claims, and challenges reasoning.
- **DreamDEX:** defines the Event Contract, prices, execution, and settlement.
- **Somnia:** provides the network, fast confirmation, oracle transport, and proof infrastructure.

Agent output is evidence for review, never an autonomous order instruction in the human lane.

## Return loop

Repeat use should come from utility rather than mandatory friction:

- The live room provides a fast current-market task.
- `What changed` reduces the cost of returning after an absence.
- Agent challenges help the user catch a missed risk.
- Receipts and calibration reward users who voluntarily build a decision history.

The interface should therefore prioritize a fast first trade while making the deeper layer discoverable and valuable.

## Responsive behavior

- Desktop: market context left, direct execution right, Decision Lab full-width below.
- Tablet: preserve two columns while the ticket remains at least 340px wide; stack below 900px.
- Mobile: canonical market and chart, direct execution ticket, then optional Decision Lab and created receipt.
- No preallocated empty receipt panel.
- All trading and lab actions have at least 44px touch targets and no horizontal overflow at 390px.

## State and error behavior

- Market selection and trade direction are shared between the order ticket and optional Decision Lab.
- Opening or resetting the lab must not reset the selected order amount.
- Market rollover clears stale analysis, attribution, and receipt state, while preserving the existing safe rollover behavior.
- Transaction confirmation and fill status remain separate.
- A failed agent signal request does not disable DreamDEX execution.
- A failed or stale DreamDEX market request disables execution with a source-specific explanation.

## Visual hierarchy

- The chart and order ticket align at the top and carry equal visual importance.
- The order ticket uses strong UP/DOWN affordances and one dominant trade button.
- Secondary metadata is placed in compact rows or disclosures.
- The Decision Lab uses a quieter surface and one expandable introduction.
- Do not render locked cards, concealed-odds placeholders, empty receipt frames, or instructions that send the user elsewhere before trading.

## Verification strategy

Test observable behavior through the rendered page and existing public modules:

1. UP/DOWN prices and selectors are available before analysis is opened.
2. A connected wallet can prepare a DreamDEX trade without creating a receipt.
3. The Decision Lab can be opened, completed, reset, and closed independently.
4. A signed receipt renders only after creation.
5. Authoritative stale/offline data still prevents unsafe execution.
6. Existing market rollover, trading, receipt, agent, and verification tests remain green.
7. Desktop and 390px mobile layouts have no horizontal overflow.

## Acceptance criteria

1. `Decide before the crowd decides for you` is not visible as the default right-column experience.
2. The default right column contains direct UP/DOWN execution and relevant risk information.
3. DreamDEX odds are never concealed by DreamPulse.
4. Forecast analysis and receipt creation are optional and located below the trading workspace.
5. No decision or receipt state gates DreamDEX execution.
6. Empty receipt and locked execution panels are removed.
7. Human, agent, DreamDEX, and Somnia responsibilities remain source-labeled.
8. Realtime, transaction safety, accessibility, and responsive behavior are preserved.
