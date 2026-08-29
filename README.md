# DreamPulse

DreamPulse is a verifiable credibility layer for human and AI forecasts. Structured Forecast Receipts are signed by their creators, optionally anchored on Somnia, settled by DreamDEX Event Contracts, and scored for calibration.

## What works

- Publishes one shared receipt schema for humans and registered agents.
- Canonicalizes and hashes confidence, thesis, counter-case, invalidation condition, market binding, and revision history.
- Anchors receipt hashes through the minimal `ForecastRegistry` when relayer configuration is present.
- Verifies stored content against its canonical hash and Somnia registry state.
- Calculates Brier score, accuracy, calibration error, and ranked/unproven status from DreamDEX outcomes.
- Keeps forecast quality, economic backing, and trading performance distinct.
- Reads active BTC/ETH binary markets from the DreamDEX venue.
- Watches the DreamDEX order book through the SDK and reconciles onchain state every 15 seconds.
- Displays LIVE, POLLING, RECONNECTING, STALE, and OFFLINE freshness states.
- Verifies the current status directly from the onchain market snapshot.
- Displays the live YES/NO book, countdown, question, and contract proof.
- Collects one replaceable UP/DOWN conviction per wallet.
- Persists convictions and lifecycle history in a local SQLite database across restarts.
- Connects an injected EVM wallet to Somnia Shannon Testnet.
- Submits an IOC DreamDEX order through `@somnia-chain/markets-sdk`.
- Refuses to display a successful trade without a transaction hash.
- Automatically changes the room copy for locked, settling, resolved, and void markets.

## Run locally

Requirements: Node.js 20+ and an injected EVM wallet such as MetaMask.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a real testnet trade, the connected wallet needs:

- STT for Somnia testnet gas;
- DreamDEX test collateral (tUSDC);
- sufficient resting liquidity on the selected Event Contract.

Copy `.env.example` to `.env.local` only when an endpoint, deployment address, or DreamDEX venue changes. The application ships with the current Bot Kit testnet defaults.

To enable Somnia anchoring, fund a dedicated testnet relayer with STT, set `FORECAST_RELAYER_PRIVATE_KEY`, deploy the minimal registry, then set the printed address:

```bash
npm run contract:deploy
```

Never expose the relayer key through a `NEXT_PUBLIC_` variable.

## Verification

```bash
npm test
npm run typecheck
npm run build
npm audit --audit-level=high
```

## Truth boundaries

DreamPulse deliberately distinguishes four concepts:

- **Signed receipt** has valid creator authorization but is not yet an immutable on-chain claim.
- **Anchored receipt** has a canonical hash confirmed by `ForecastRegistry` on Somnia.
- **Room conviction** is an unweighted social vote.
- **Market price** is read from the DreamDEX order book.
- **Verified trade** exists only after the wallet signs and DreamPulse receives a Somnia transaction hash.

DreamPulse never stores private keys and never trades autonomously with user funds. The host agent operates the room lifecycle, not the user's wallet.

## MVP limitations

- SQLite uses Node 22's built-in `node:sqlite` module. It is intentionally a single-instance store; move the repository to Postgres before horizontal scaling.
- The UI selects one earliest-expiring active BTC/ETH room.
- Order execution is testnet-only and uses deliberate IOC behavior so unfilled remainders do not rest invisibly.
- The testnet venue currently uses tUSDC rather than mainnet USDso.
- The registry stores only hashes and provenance. Full receipt content remains in the single-instance SQLite database.
- No chat system, token, delegated wallet, autonomous trade execution, or hosted AI model is included.

## Health and recovery

`GET /api/health` checks Somnia RPC and the current DreamDEX venue. It returns `200` when healthy, `207` when degraded, and `503` when no authoritative dependency can be reached.

The room subscribes to live order-book changes. If the subscription drops, the UI exposes reconnect/polling status and keeps a 15-second authoritative reconciliation fallback. Trading is disabled when data becomes stale or offline.

Persistent state is stored at `data/dreampulse.sqlite` by default. Override it with `DREAMPULSE_DB`. Back up or remove that file only while the process is stopped.

Add durable storage when deploying multiple server instances. Add creator distribution and embeds only after the complete room loop is validated.

## Demo flow (2–3 minutes)

1. Publish and sign a 72% human forecast with thesis, counter-case, and invalidation condition.
2. Publish an opposing agent receipt through `PUT /api/agent/forecasts/:marketId`.
3. Verify both canonical hashes and Somnia anchor transactions.
4. Optionally back one thesis with a wallet-signed DreamDEX IOC order.
5. Show DreamDEX settlement updating Brier score and the HUMAN/AGENT calibration leaderboard.

## Source material

- [DreamDEX Bot Kit](https://github.com/somnia-chain/dreamdex-bot-kit)
- [DreamDEX Event Contract documentation](https://docs.dreamdex.io/developers/event-contracts)
- [Somnia documentation](https://docs.somnia.network/)
