import { isBinaryMarket, SomniaMarkets, type UnifiedBalances, type UnifiedMarket, type UnifiedOrder } from "@somnia-chain/markets-sdk"
import { createPublicClient, createWalletClient, custom, http, type EIP1193Provider, type Hex, type WalletClient } from "viem"
import { DREAMDEX, somniaTestnet } from "./config"
import { phaseFromStatus } from "./lifecycle"
import { reconnectDelay, type FreshnessState } from "./realtime"
import type { TransactionState } from "./transactions"
import type { Direction, MarketView } from "./types"
import { buildOracleChartView } from "./oracle-chart"

const createExchange = (walletClient?: WalletClient) =>
  new SomniaMarkets({
    indexerUrl: DREAMDEX.indexerUrl,
    chain: somniaTestnet,
    wsRpcUrl: DREAMDEX.wsUrl,
    addresses: DREAMDEX.addresses,
    priceFeed: DREAMDEX.priceFeed,
    walletClient,
  })

const sameVenue = (value?: string | null) => value?.toLowerCase() === DREAMDEX.venueId.toLowerCase()

export type OrderExecution = {
  status: "FILLED" | "PARTIAL" | "UNFILLED"
  requested: number
  filled: number
  remaining: number
  averagePrice: number | null
}

export type PortfolioView = {
  collateral: number
  collateralCode: string
  upShares: number
  downShares: number
}

export function orderExecution(
  order: Pick<UnifiedOrder, "amount" | "filled" | "remaining" | "price" | "status" | "info">,
  direction: Direction,
): OrderExecution {
  const fills = ((order.info as { fills?: { quantityFilled: bigint; fillPrice: bigint }[] })?.fills || [])
  const quantity = fills.reduce((sum, fill) => sum + fill.quantityFilled, 0n)
  const yesPrice = quantity
    ? Number(fills.reduce((sum, fill) => sum + fill.quantityFilled * fill.fillPrice, 0n) / quantity) / 10 ** DREAMDEX.decimals
    : null
  const averagePrice = yesPrice === null ? null : direction === "DOWN" ? 1 - yesPrice : yesPrice
  return {
    status: order.filled <= 0 ? "UNFILLED" : order.remaining > 0 ? "PARTIAL" : "FILLED",
    requested: order.amount,
    filled: order.filled,
    remaining: order.remaining,
    averagePrice,
  }
}

export function portfolioFromBalances(
  balances: UnifiedBalances,
  market: Pick<MarketView, "yesSymbol" | "noSymbol">,
): PortfolioView {
  const quote = market.yesSymbol.split("/")[1]?.split("#")[0]
  const collateralCode = Object.keys(balances).find((code) => code.toLowerCase() === quote?.toLowerCase())
    || Object.keys(balances).find((code) => code.toLowerCase().includes("usdc"))
    || quote
    || "tUSDC"
  return {
    collateral: balances[collateralCode]?.total || 0,
    collateralCode,
    upShares: balances[market.yesSymbol]?.total || 0,
    downShares: balances[market.noSymbol]?.total || 0,
  }
}

export async function currentMarket(): Promise<MarketView> {
  const exchange = createExchange()
  try {
    const all = Object.values(await exchange.loadMarkets(true)) as UnifiedMarket[]
    const live = all.filter((market) =>
      market.type === "binary" &&
      market.active &&
      isBinaryMarket(market.info) &&
      ["BTC", "ETH"].includes(market.info.asset.toUpperCase()),
    )
    const scoped = live.filter((market) => isBinaryMarket(market.info) && sameVenue(market.info.venueId))
    const venues = [...new Set(live.map((market) => isBinaryMarket(market.info) ? market.info.venueId?.toLowerCase() : null).filter(Boolean))]
    const candidates = (scoped.length ? scoped : venues.length === 1 ? live : [])
      .sort((a, b) => Number(isBinaryMarket(a.info) ? a.info.expiry : 0) - Number(isBinaryMarket(b.info) ? b.info.expiry : 0))

    const market = candidates[0]
    if (!market || !isBinaryMarket(market.info)) {
      const detail = venues.length > 1 ? ` Live markets span ${venues.length} venues; set NEXT_PUBLIC_DREAMDEX_VENUE_ID explicitly.` : ""
      throw new Error(`No active BTC or ETH DreamDEX Event Contract is available on the configured venue.${detail}`)
    }

    const info = market.info
    const onchain = await exchange.client.getMarketOnchain(info.marketId)
    const yesSymbol = market.outcomes?.[0]?.symbol || `${market.symbol}#YES`
    const noSymbol = market.outcomes?.[1]?.symbol || `${market.symbol}#NO`
    const book = await exchange.fetchOrderBook(yesSymbol, 3).catch(() => ({ bids: [], asks: [] }))
    const yes = book.asks[0]?.[0] ?? book.bids[0]?.[0] ?? null
    const status = Number(onchain.status)
    const outcome = info.winningOutcome === 0 ? "UP" : info.winningOutcome === 1 ? "DOWN" : null

    return {
      id: info.marketId,
      symbol: market.symbol,
      asset: info.asset.toUpperCase() as "BTC" | "ETH",
      question: info.question,
      durationSec: Number(info.intervalSec || Number(info.expiry) - Number(info.tradingStart)),
      strike: info.strike === "0" ? "Opening price" : info.strike,
      upPrice: yes,
      downPrice: yes === null ? null : Math.max(0, Math.min(1, 1 - yes)),
      opensAt: Number(info.tradingStart),
      locksAt: Number(onchain.expiry),
      phase: phaseFromStatus(status),
      outcome,
      contractAddress: onchain.pool,
      yesSymbol,
      noSymbol,
      statusCode: status,
      isLive: status === 1,
    }
  } finally {
    await Promise.race([exchange.close(), new Promise((resolve) => setTimeout(resolve, 1_500))]).catch(() => undefined)
  }
}

export async function loadOracleChart(market: MarketView, now = Date.now()) {
  const exchange = createExchange()
  try {
    const candles = await exchange.client.fetchPriceCandles(market.asset, "M1", {
      from: market.opensAt,
      to: Math.floor(now / 1000),
      limit: 240,
    })
    return buildOracleChartView(market, candles, now)
  } finally {
    await Promise.race([exchange.close(), new Promise((resolve) => setTimeout(resolve, 1_500))]).catch(() => undefined)
  }
}

export async function browserExchange(provider: EIP1193Provider) {
  const walletClient = createWalletClient({ chain: somniaTestnet, transport: custom(provider) })
  const [account] = await walletClient.requestAddresses()
  if (!account) throw new Error("No wallet account was selected.")
  const exchange = createExchange(walletClient)
  exchange.setSigner({ walletClient, account })
  await exchange.loadMarkets()
  return { exchange, walletClient, account }
}

export async function faucetBrowserCollateral(provider: EIP1193Provider) {
  const { exchange } = await browserExchange(provider)
  try {
    return await exchange.trader.faucet()
  } finally {
    await Promise.race([exchange.close(), new Promise((resolve) => setTimeout(resolve, 1_500))]).catch(() => undefined)
  }
}

export async function browserPortfolio(provider: EIP1193Provider, market: Pick<MarketView, "yesSymbol" | "noSymbol">) {
  const { exchange } = await browserExchange(provider)
  try {
    return portfolioFromBalances(await exchange.fetchBalance(), market)
  } finally {
    await Promise.race([exchange.close(), new Promise((resolve) => setTimeout(resolve, 1_500))]).catch(() => undefined)
  }
}

export function watchMarketBook(
  market: MarketView,
  onUpdate: (prices: { upPrice: number | null; downPrice: number | null; verifiedAt: number }) => void,
  onState: (state: FreshnessState) => void,
) {
  const exchange = createExchange()
  let stopped = false

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const run = async () => {
    let attempt = 0
    while (!stopped) {
      try {
        onState(attempt ? "RECONNECTING" : "POLLING")
        const book = await exchange.watchOrderBook(market.yesSymbol, 3)
        if (stopped) break
        const yes = book.asks[0]?.[0] ?? book.bids[0]?.[0] ?? null
        onUpdate({ upPrice: yes, downPrice: yes === null ? null : Math.max(0, Math.min(1, 1 - yes)), verifiedAt: Date.now() })
        onState("LIVE")
        attempt = 0
      } catch {
        if (stopped) break
        onState("RECONNECTING")
        await wait(reconnectDelay(attempt++))
      }
    }
  }
  void run()

  return async () => {
    stopped = true
    await Promise.race([exchange.close(), wait(1_500)]).catch(() => undefined)
  }
}

export async function placeBrowserOrder(input: {
  provider: EIP1193Provider
  market: MarketView
  direction: Direction
  shares: number
  onState?: (state: TransactionState, hash?: Hex) => void
}) {
  input.onState?.("PREFLIGHT")
  const { exchange, account } = await browserExchange(input.provider)
  try {
    const publicClient = createPublicClient({ chain: somniaTestnet, transport: http(DREAMDEX.rpcUrl) })
    const gas = await publicClient.getBalance({ address: account })
    if (gas === 0n) throw new Error("Wallet has no STT for Somnia testnet gas.")
    const latest = await exchange.client.getMarketOnchain(input.market.id as Hex)
    if (Number(latest.status) !== 1) throw new Error("This Event Contract is no longer trading.")
    if (Number(latest.expiry) - Date.now() / 1000 < 30) throw new Error("This market is too close to lock. Join the next room.")

    const symbol = input.direction === "UP" ? input.market.yesSymbol : input.market.noSymbol
    const book = await exchange.fetchOrderBook(symbol, 3)
    const ask = book.asks[0]?.[0]
    if (ask === undefined) throw new Error(`No resting ${input.direction} quote is available.`)
    if (!Number.isFinite(input.shares) || input.shares <= 0) throw new Error("Stake must be greater than zero.")

    input.onState?.("AWAITING_SIGNATURE")
    const result = await exchange.createOrder(symbol, "limit", "buy", input.shares, ask, {
      timeInForce: "IOC",
    })
    const receipt = (result.info as { receipt?: { status?: string }; hash?: Hex } | undefined)?.receipt
    const hash = (result.info as { hash?: Hex } | undefined)?.hash || (result as { txHash?: Hex }).txHash
    if (receipt?.status === "reverted") throw new Error(`Order reverted onchain${hash ? ` (${hash})` : ""}.`)
    if (!hash) throw new Error("DreamDEX did not return a transaction hash; the order is not shown as confirmed.")
    input.onState?.("CONFIRMED", hash)
    return { hash, account, execution: orderExecution(result, input.direction) }
  } finally {
    await Promise.race([exchange.close(), new Promise((resolve) => setTimeout(resolve, 1_500))]).catch(() => undefined)
  }
}
