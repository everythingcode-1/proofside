# Proofside Operations

## Runtime

Run Proofside as one Node.js 22+ process with persistent access to the `data/` directory.

```bash
npm install
npm run build
npm start
```

For local development, use `npm run dev`.

## Forecast registry

Use a dedicated Shannon testnet wallet for the receipt relayer. It needs STT for gas but never handles user collateral.

```text
FORECAST_RELAYER_PRIVATE_KEY=0x...
FORECAST_REGISTRY_ADDRESS=0x...
```

Deploy once with `npm run contract:deploy`, then copy the printed contract address into `.env.local` and restart Proofside. If either variable is absent, publication remains honest: receipts stop at `SIGNED` and the UI never labels them anchored.

The relayer key must remain server-only. Rotation requires calling `setRelayer` from the registry owner and updating the environment variable.

Agent publication uses the existing bearer key:

```bash
curl -X PUT "$PROOFSIDE_URL/api/agent/forecasts/$MARKET_ID" \
  -H "Authorization: Bearer $PROOFSIDE_AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"direction":"UP","confidenceBps":7200,"thesis":"Demand remains above open.","counterCase":"Risk-off pressure can reverse it.","invalidationCondition":"Price breaks below open."}'
```

## Health

Check:

```text
GET /api/health
```

- `200 healthy`: RPC and DreamDEX market discovery are available.
- `207 degraded`: one dependency failed but partial service remains.
- `503 unavailable`: no authoritative market state can be read.

The response contains only safe diagnostics: block number, configured venue, selected market, phase, and latency.

## Persistent state

Default database:

```text
data/dreampulse.sqlite
```

Set `PROOFSIDE_DB` to an absolute writable path for deployment. `DREAMPULSE_DB` remains a supported legacy alias. The SQLite repository is for a single process. Do not run multiple replicas against the same file over a network filesystem.

Backup procedure:

1. Stop Proofside.
2. Copy `dreampulse.sqlite` and any `-wal`/`-shm` companions together.
3. Restart the process.

## Realtime recovery

Proofside watches the DreamDEX order book through `@somnia-chain/markets-sdk` and reconciles with `/api/market` every 15 seconds.

- `LIVE`: subscription and snapshot are fresh.
- `POLLING`: subscription unavailable; reconciliation works.
- `RECONNECTING`: retry backoff is active.
- `STALE`: no verified update for 20 seconds; trading is disabled.
- `OFFLINE`: no authoritative snapshot exists; trading is disabled.

Reconnect delay caps at 15 seconds. No operator action is normally required.

## Release gate

```bash
npm test
npm run typecheck
npm run build
npm audit --audit-level=high
```

Then verify `/`, `/reputation`, `/verify`, `/api/market`, and `/api/health`; restart the server and confirm a previously submitted receipt remains visible and recomputes to the same hash.

## Wallet trade checklist

The prepared demo wallet needs:

- Somnia Shannon Testnet selected (`50312`);
- STT for gas;
- DreamDEX tUSDC collateral;
- available resting liquidity;
- at least 30 seconds before market lock.

A confirmed transaction is not automatically described as a fill. Use the proof panel and DreamDEX/Somnia explorer evidence during the demo.
