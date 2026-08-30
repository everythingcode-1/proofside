# DreamPulse Forecast-First Market Workspace

## Objective

Turn the home page into a clear consumer workflow that demonstrates meaningful DreamDEX Event Contract usage without presenting DreamPulse as another trading terminal. DreamPulse is the credibility layer: a human or agent publishes a falsifiable forecast receipt, may optionally back it economically on DreamDEX, and builds a permanent calibration history after DreamDEX settlement.

## Product hierarchy

1. **DreamDEX** is authoritative for the Event Contract question, order book, contract status, and settlement.
2. **Somnia** is authoritative for the network, oracle transport, transaction confirmation, and anchored proof.
3. **DreamPulse** creates forecast receipts, social conviction, agent attribution, and calibration scores.

The interface must never merge those sources under an ambiguous label. Interpretive copy must be labeled as DreamPulse context and must not paraphrase a canonical settlement rule.

## Desktop composition

The primary workspace is a two-column grid directly below the concise product introduction.

### Left: Live DreamDEX Market

- Show the exact `market.question` under the label **DreamDEX canonical rule**.
- Show market duration, countdown, market ID, and opening reference.
- Show the BTC/USDC or ETH/USDC chart under **Somnia oracle data**.
- Show connection state and last update without hiding the last valid snapshot during reconnects.
- Show UP and DOWN prices under **DreamDEX order book**.
- Do not place social room conviction inside the canonical-rule card.

### Right: Forecast First

- Show the selected canonical market at the top.
- Collect direction, confidence, thesis, counter-case, and invalidation condition.
- Explain that confidence becomes a calibration score after DreamDEX settlement.
- End with one primary action: **Review & sign forecast**.
- Wallet signature and Somnia anchoring status must use progressive, plain-language feedback.
- Trading must not be required to publish a forecast.

The two columns align at the top. The market column may be wider because the chart needs visual space. The forecast column remains visible without becoming sticky on mobile.

## Post-publication workspace

After a receipt is created, add a two-column row below the primary workspace:

- **Left: Verifiable receipt** — creator identity, canonical hash, confidence, thesis, counter-case, invalidation, timestamp, proof state, and verification link.
- **Right: Optional economic backing** — wallet, stake size, maximum loss, DreamDEX IOC execution, and explicit signing state.

Before publication, the lower row may show recent receipts followed by the existing live-room context. Economic backing remains available, but visually secondary to forecast creation.

## Source labels and wording

Use these exact labels:

- `DreamDEX canonical rule`
- `DreamDEX order book`
- `Somnia oracle data`
- `DreamPulse social signal`
- `DreamPulse interpretation`

Remove the current generated `MARKET RULE` paragraph. If explanatory text is useful, display it as **DreamPulse interpretation** and never restate the comparison operator. Example: “The market is currently pricing UP at 3¢. Social conviction is 50% UP.”

## Responsive behavior

- **Desktop:** market left and forecast right; receipt left and backing right below.
- **Tablet:** primary columns remain side by side while usable; below 900px they stack.
- **Mobile:** canonical market → forecast composer → receipt → optional backing.
- Trading actions and form fields must have at least 44px touch targets.
- Long hashes, symbols, and market questions must wrap without horizontal overflow.

## Realtime and error behavior

- Preserve the last valid market and oracle snapshot while fetching replacements.
- Prefetch the next Event Contract during the final 15 seconds and swap only after it is ready.
- A reconnect badge must identify the affected source: DreamDEX order book, Somnia oracle, or DreamPulse API.
- Disable trading on stale or offline authoritative market data, but keep forecast content readable.
- Never report a confirmed transaction as a confirmed fill. Display execution status separately.

## Accessibility and interaction

- Use semantic headings, buttons, labels, and landmark regions.
- Preserve visible keyboard focus.
- Do not communicate UP/DOWN or connectivity with color alone.
- Maintain `prefers-reduced-motion` behavior.
- Announce signing, anchoring, reconnecting, and verification results through polite live regions.

## Hackathon fit

- **Innovation:** permanent, calibration-based reputation rather than a generic social feed.
- **Technical implementation:** DreamDEX Event Contracts, order-book execution, wallet signatures, Somnia proof, and realtime streams are visible and source-labeled.
- **UX:** one coherent forecast-first journey with optional trading.
- **Ecosystem impact:** forecasts lead naturally to DreamDEX backing and repeat reputation building for humans and agents.
- **Demo:** select a live market, publish a receipt, verify its proof, optionally place a DreamDEX order, and show the future calibration lifecycle.

## Acceptance criteria

1. No generated paragraph is labeled as a DreamDEX market rule.
2. The canonical question is rendered verbatim from `market.question`.
3. Market, oracle, social, and interpretation sources are visually distinct.
4. The primary desktop workspace is market-left and forecast-right.
5. Forecast publication remains possible without a DreamDEX position.
6. Economic backing is explicitly optional and requires wallet approval.
7. The layout has no horizontal overflow at 390px, 700px, 900px, and desktop widths.
8. Existing realtime rollover, receipt, agent, verification, and trading tests remain green.
