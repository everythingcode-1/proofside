# Proofside 90-Point Ponytail Execution Brief

## Mission

Raise Proofside from an estimated 79/100 to at least 90/100 for the Somnia × DreamDEX Event Contracts Hackathon by proving one complete story:

> A reference agent reads a live DreamDEX market, publishes an attributed forecast, a user signs a decision and optionally trades it on DreamDEX, the receipt is verifiable on Somnia, and settlement updates the agent's track record.

Do not broaden the product. Make this one path reliable, obvious, and demonstrable in under three minutes.

## Ponytail rules

- Reuse the existing DreamDEX SDK, agent API, forecast service, registry, SQLite store, calibration code, and UI.
- Add no dependency unless the installed stack cannot perform the task.
- One reference agent is enough. BTC/ETH binary markets are enough.
- The agent does not hold funds or trade autonomously.
- Prefer deterministic rules over an LLM dependency. The innovation is the verifiable agent lifecycle, not generated prose.
- Do not build chat, tokens, copy trading, multi-agent orchestration, a marketplace, notifications, or production-scale infrastructure.
- Never remove validation, transaction truthfulness, signature checks, or accessibility to reduce code.
- Every new non-trivial branch or money/security path needs one focused automated test.

## Definition of done

The work is complete only when a reviewer can perform this flow on the deployed testnet application:

1. Open an active DreamDEX BTC or ETH Event Contract.
2. See a named reference agent forecast with direction, confidence, thesis, counter-case, invalidation condition, timestamp, and evidence inputs.
3. Open Decision Lab, form a human forecast, and sign it with a wallet.
4. See the receipt become `SIGNED`, then `ANCHORED`, with an explorer link.
5. Optionally place a wallet-signed DreamDEX IOC order and see `FILLED`, `PARTIAL`, or `UNFILLED`—never a false success.
6. Verify the receipt hash, creator signature, market binding, anchor transaction, and optional backing trade.
7. Open Track Records and see at least one clearly labelled, verifiable settled example with Brier score and calibration progress.
8. Complete the recorded path in under three minutes without using developer tools or manually calling an API.

## Work order

### P0 — Reference agent

Build one server-side reference agent named `Proofside Sentinel`.

Use existing market data. Calculate a deterministic forecast from values already available in the application:

- Compare live oracle price with the market strike when the strike is numeric.
- Use the current YES/NO market price as the base probability.
- Clamp confidence to 55–85%.
- Choose `UP` when the calculated probability is at least 50%; otherwise choose `DOWN`.
- Generate a short templated thesis, counter-case, and invalidation condition from those values.
- Attach evidence values and observation time; do not claim external news analysis.
- Publish through the existing authenticated agent forecast path so the agent uses the same receipt, anchoring, settlement, and reputation pipeline as third-party agents.
- Do not add an LLM API, scheduler service, queue, or autonomous wallet.

Minimum UI:

- Show the latest Sentinel forecast in Decision Lab.
- Label it `RULE-BASED REFERENCE AGENT`.
- Show `Updated <time>` and whether its receipt is signed/anchored.
- Provide one `Refresh agent forecast` action for the demo. Automatic scheduling is unnecessary.

Acceptance checks:

- A focused test proves direction, confidence bounds, and generated fields for one UP and one DOWN input.
- Repeating the same observation is idempotent and does not create duplicate receipts.
- Agent failure does not block market viewing or human trading.

### P0 — On-chain receipt proof

Use the existing `ForecastRegistry`; do not design a new contract.

- Deploy it to Somnia Shannon Testnet.
- Fund the relayer with only enough STT for the demo.
- Set production/testnet `FORECAST_REGISTRY_ADDRESS` and `FORECAST_RELAYER_PRIVATE_KEY` securely.
- Confirm an anchor transaction on the Somnia explorer.
- Surface anchor state and explorer URL on receipt and verification pages.
- Keep `SIGNED` and `ANCHORED` distinct. If anchoring fails, show failure and retry guidance; never imply success.

Acceptance checks:

- A new forecast produces a transaction hash and an explorer link.
- `/verify` detects a modified receipt as invalid.
- Existing registry tests and forecast-service tests remain green.
- Record the deployed registry address in `README.md`; never commit the private key.

### P0 — Reliable DreamDEX execution

Keep IOC execution and the existing SDK integration.

- Before wallet signature, show best available ask, requested contracts, estimated maximum fill from the fetched depth, estimated cost, available collateral, and maximum loss.
- Disable submission for zero/non-finite size, stale market data, unavailable quote, insufficient balance, or a market within the existing lock safety window.
- Preserve honest outcomes: `FILLED`, `PARTIAL`, and `UNFILLED`.
- Link a returned transaction hash to the Somnia explorer.
- Provide visible recovery text for missing wallet, wrong network, missing STT, missing collateral, no liquidity, rejection, and revert.

Do not build a full order-book trading terminal, slippage configuration, limit-order management, or portfolio history.

Acceptance checks:

- Tests cover estimated fill and insufficient-liquidity behavior.
- No confirmed UI is possible without a transaction hash.
- One manual testnet transaction is saved for the demo evidence.

### P1 — Non-empty, honest track record

Use the existing settlement and calibration functions.

- Show `UNPROVEN` creators and progress such as `2/5 settled forecasts` instead of hiding them.
- Add a compact row/card with creator type, settled count, accuracy, mean Brier score, calibration error, backing rate, and receipt link.
- Explain Brier score in one sentence: `Lower is better; it rewards accurate confidence.`
- Include at least one settled testnet example before recording the demo.
- If reliable testnet settlement cannot be obtained in time, add a clearly labelled `DEMO DATA` fixture visible only when an explicit demo environment flag is enabled. Never mix it with verified results.

Do not build social profiles, follows, comments, badges, or rewards.

Acceptance checks:

- Empty state explains how to become ranked.
- Verified and demo records are visually distinguishable.
- Receipt links open a valid verification view.

### P1 — Simplify the product story

Use this message consistently:

> Proofside turns human and AI market forecasts into verifiable track records—and lets users act on them directly through DreamDEX.

Homepage order:

1. Live market and UP/DOWN action.
2. `What changed?` reference-agent evidence.
3. Human Decision Lab.
4. Signed/anchored receipt.
5. Track-record proof.

Use benefit-first labels:

- `Canonical hash` → `Tamper-proof fingerprint`
- `EIP-712 authorization` → `Wallet-signed forecast`
- `Brier score` → `Confidence accuracy (Brier)`
- `ForecastRegistry anchor` → `Timestamped on Somnia`

Keep technical terms inside an expandable `Proof details` area. Do not redesign the visual system.

Acceptance checks:

- A first-time user can identify the active market, agent view, primary action, and proof state without scrolling through documentation.
- Mobile navigation reaches Live Market, Agents, Track Records, and Verify.

### P1 — Demo and submission evidence

Create a reliable 2–3 minute recording with this script:

- 0:00–0:20: Prediction markets show prices, but not who is reliably confident.
- 0:20–0:45: Sentinel reads the live DreamDEX contract and publishes an attributed forecast.
- 0:45–1:15: The user forms and wallet-signs a decision.
- 1:15–1:45: The user optionally backs it with a DreamDEX IOC order; show its honest execution state and explorer link.
- 1:45–2:15: Verify the receipt fingerprint, market binding, creator, and Somnia anchor.
- 2:15–2:40: Show settlement and calibration/track-record impact.
- 2:40–3:00: Explain the growth loop: forecasts → decisions → DreamDEX trades → settlement → trusted agent reputation.

Prepare before recording:

- Public deployment URL.
- Active market confirmed.
- Demo wallet funded with STT and tUSDC.
- Registry relayer funded.
- At least one known transaction and anchored receipt as fallback evidence.
- Seeded, clearly labelled demo record only if live settlement timing makes it necessary.
- GitHub README with setup, deployed URL, registry address, architecture summary, limitations, and demo link.

## Required verification gate

Before declaring completion, run:

```bash
npm test
npm run typecheck
npm run build
```

Then manually verify desktop and mobile golden paths. Save screenshots of:

- Live market with Sentinel forecast.
- Preflight execution estimate.
- Transaction state and explorer link.
- Anchored receipt verification.
- Populated Track Records.

Report exact test totals, build result, deployment URL, registry address, one anchor transaction, and one DreamDEX transaction. A mocked screenshot or passing unit test alone is not completion.

## Score target

| Criterion | Target | Evidence |
|---|---:|---|
| Innovation | 19/20 | One agent/human receipt lifecycle with revisions and calibrated reputation |
| Technical | 24/25 | Live SDK reads, wallet trade, registry anchor, verification, tests/build |
| UX | 18/20 | One clear golden path, honest execution states, recovery messages |
| Business impact | 17/20 | Direct path from agent evidence to DreamDEX activity and retention via reputation |
| Presentation | 13/15 | Rehearsed sub-three-minute demo with fallback proof |
| **Total** | **91/100** | All evidence visible and reproducible |

## Explicitly skipped

- Hosted generative AI: add only when deterministic Sentinel proves user demand for richer analysis.
- Autonomous trading: add only after permissions, risk limits, and custody implications are designed.
- Postgres/Redis migration: add when moving beyond a single-instance hackathon deployment.
- Multiple agents and assets: add after one agent completes the entire lifecycle reliably.
- Chat, feeds, follows, notifications, token, marketplace, and copy trading: add only when the core forecast-to-trade conversion is measured.

