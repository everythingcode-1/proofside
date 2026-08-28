import { isBinaryMarket, SomniaMarkets, type UnifiedMarket } from "@somnia-chain/markets-sdk"
import { createWalletClient, custom, type EIP1193Provider, type Hex, type WalletClient } from "viem"
import { DREAMDEX, somniaTestnet } from "./config"
import { phaseFromStatus } from "./lifecycle"
import type { Direction, MarketView } from "./types"

const createExchange = (walletClient?: WalletClient) =>
  new SomniaMarkets({
    indexerUrl: DREAMDEX.indexerUrl,
    chain: somniaTestnet,
    wsRpcUrl: DREAMDEX.wsUrl,
    addresses: DREAMDEX.addresses,
    walletClient,
  })

const sameVenue = (value?: string | null) => value?.toLowerCase() === DREAMDEX.venueId.toLowerCase()

export async function currentMarket(): Promise<MarketView> {
  const exchange = createExchange()
  try {
    const all = Object.values(await exchange.loadMarkets(true)) as UnifiedMarket[]
    const candidates = all
      .filter((market) => {
        if (market.type !== "binary" || !isBinaryMarket(market.info)) return false
        return sameVenue(market.info.venueId) && ["BTC", "ETH"].includes(market.info.asset.toUpperCase())
      })
      .sort((a, b) => Number(isBinaryMarket(a.info) ? a.info.expiry : 0) - Number(isBinaryMarket(b.info) ? b.info.expiry : 0))

    const market = candidates[0]
    if (!market || !isBinaryMarket(market.info)) throw new Error("No active BTC or ETH DreamDEX Event Contract is available on the configured venue.")

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

export async function browserExchange(provider: EIP1193Provider) {
  const walletClient = createWalletClient({ chain: somniaTestnet, transport: custom(provider) })
  const [account] = await walletClient.requestAddresses()
  if (!account) throw new Error("No wallet account was selected.")
  return { exchange: createExchange(walletClient), walletClient, account }
}

export async function placeBrowserOrder(input: {
  provider: EIP1193Provider
  market: MarketView
  direction: Direction
  shares: number
}) {
  const { exchange, account } = await browserExchange(input.provider)
  try {
    const latest = await exchange.client.getMarketOnchain(input.market.id as Hex)
    if (Number(latest.status) !== 1) throw new Error("This Event Contract is no longer trading.")
    if (Number(latest.expiry) - Date.now() / 1000 < 30) throw new Error("This market is too close to lock. Join the next room.")

    const symbol = input.direction === "UP" ? input.market.yesSymbol : input.market.noSymbol
    const book = await exchange.fetchOrderBook(symbol, 3)
    const ask = book.asks[0]?.[0]
    if (ask === undefined) throw new Error(`No resting ${input.direction} quote is available.`)
    if (!Number.isFinite(input.shares) || input.shares <= 0) throw new Error("Stake must be greater than zero.")

    const result = await exchange.createOrder(symbol, "limit", "buy", input.shares, ask, {
      timeInForce: "IOC",
    })
    const receipt = (result.info as { receipt?: { status?: string }; hash?: Hex } | undefined)?.receipt
    const hash = (result.info as { hash?: Hex } | undefined)?.hash || (result as { txHash?: Hex }).txHash
    if (receipt?.status === "reverted") throw new Error(`Order reverted onchain${hash ? ` (${hash})` : ""}.`)
    if (!hash) throw new Error("DreamDEX did not return a transaction hash; the order is not shown as confirmed.")
    return { hash, account }
  } finally {
    await Promise.race([exchange.close(), new Promise((resolve) => setTimeout(resolve, 1_500))]).catch(() => undefined)
  }
}
