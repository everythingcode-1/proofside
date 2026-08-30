# Market-linked Oracle Chart

**Date:** 2026-08-30  
**Status:** Approved design

## Objective

Make each BTC or ETH DreamDEX Event Contract immediately understandable by displaying the underlying oracle price path relative to the line the market resolves against. The chart follows the active market asset automatically and uses only the price-feed facilities exposed by `@somnia-chain/markets-sdk`.

## Data authority

DreamDEX's SDK exposes a standalone Somnia price-feed indexer configured through `SOMNIA_TESTNET_PRICE_FEED`. It provides BTC and ETH spot/EMA data with chain timestamps and OHLC candles at `M1`, `H1`, and `D1` resolution.

The first release uses:

- `fetchPriceCandles(asset, "M1", { from, to, limit })` for chart history;
- the most recent candle close as the displayed current price;
- the first available candle open at or after `market.opensAt` as the visible opening reference;
- `MarketView.strike` when DreamDEX supplies an explicit numeric strike;
- chain candle timestamps for the x-axis and freshness calculation.

No Binance, CoinGecko, browser-generated random data, interpolation, or synthetic price points are permitted.

## Architecture

```text
DreamDEX active Event Contract
        |
        | asset + opensAt + locksAt + strike
        v
GET /api/market/:marketId/chart
        |
        | DreamDEX SDK price-feed candles
        v
Normalized OracleChartView
        |
        v
Native SVG MarketOracleChart
```

The server owns SDK access, time-window validation, normalization, and cache headers. The client receives display-ready numeric points and renders them without another dependency.

## API contract

```text
GET /api/markets/:marketId/chart
```

Successful response:

```ts
type OracleChartView = {
  marketId: string
  asset: "BTC" | "ETH"
  quote: "USDC"
  resolution: "M1"
  opensAt: number
  locksAt: number
  openingPrice: number | null
  currentPrice: number | null
  change: number | null
  changePercent: number | null
  updatedAt: number | null
  freshness: "LIVE" | "STALE" | "EMPTY"
  points: Array<{ time: number; open: number; high: number; low: number; close: number }>
}
```

The route first loads the authoritative current DreamDEX market and requires its ID to match the requested ID. It requests a bounded M1 window from `opensAt` through the current time, capped at 240 candles. This supports the current short-duration Event Contracts without an unbounded query.

Responses use `Cache-Control: no-store`. A chart read failure returns a stable error response and never makes `/api/market` unavailable.

## Opening-price rule

If `market.strike` is a finite positive number, that exact strike is the line to beat. If the market uses the symbolic `Opening price` rule, the chart uses the opening value from the first returned M1 candle at or after `opensAt`.

The UI labels a candle-derived line as `Oracle candle open`, not as a final settlement answer. DreamDEX remains authoritative at resolution. When no qualifying candle exists, `openingPrice` is `null`; the chart remains visible but does not invent a line.

## Freshness

- `LIVE`: latest candle is no more than 120 seconds old.
- `STALE`: points exist but the newest candle is older than 120 seconds.
- `EMPTY`: no valid candle exists.

The freshness label is separate from the DreamDEX order-book freshness because the underlying oracle feed and the Event Contract book are different data streams.

## Rendering

`MarketOracleChart` is inserted after the market question/line row and before the UP/DOWN contract cards.

It displays:

- asset/USDC;
- current price;
- absolute and percentage change from opening;
- opening-price label;
- a smooth native SVG close-price path;
- a subtle area fill;
- a dashed opening reference line;
- green shading above opening and red shading below opening;
- first/latest timestamps;
- oracle freshness and data-source label.

The chart uses `viewBox` coordinates and `preserveAspectRatio`, so no canvas resize observer or chart library is required. SVG geometry is calculated by pure functions and covered by unit tests.

Color alone never communicates direction: labels include `Above opening`, `Below opening`, `+`, or `−`. The SVG has an accessible label and a text summary remains readable without it.

## Client behavior

The chart fetches immediately when a market is loaded and every 15 seconds afterward, aligned with the existing market reconciliation cadence. A market ID change clears the old points before fetching the new asset.

During loading, the fixed-height shell shows `Reading Somnia oracle…` to prevent layout shift. On error, it shows a compact unavailable state and retry button while the rest of the market and trading flow continue working.

Motion is limited to a short opacity/path reveal when new data first arrives. Subsequent polling updates the path without replaying a large entrance animation. `prefers-reduced-motion` disables the reveal through the existing global rule.

## Error handling

- Current market mismatch: `404 MARKET_NOT_FOUND`.
- DreamDEX market discovery failure: `503 DREAMDEX_UNAVAILABLE`, retryable.
- Price-feed request failure: `503 ORACLE_UNAVAILABLE`, retryable.
- Empty feed: successful `200` response with `freshness: "EMPTY"` and no points.
- Invalid or non-finite candle values: discard the affected rows.
- Fewer than two valid points: show numeric state without drawing a misleading path.

## Testing

Automated tests cover:

- bounded query window and active-market matching;
- BTC and ETH asset propagation;
- numeric strike versus candle-derived opening price;
- current price and change calculations;
- stale and empty states;
- invalid candle filtering;
- SVG coordinate normalization for flat and changing series;
- no path for fewer than two points;
- stable API error envelopes;
- existing market, receipt, agent, and trading tests remain green.

Acceptance requires the live room to show the correct asset chart, line-to-beat relationship, freshness, and source attribution while preserving successful typecheck and production build.

