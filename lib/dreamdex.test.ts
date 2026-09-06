import { beforeEach, describe, expect, it, vi } from "vitest"

const loadMarkets = vi.fn(async () => ({}))
const faucet = vi.fn(async () => ({ hash: "0xabc" }))
const close = vi.fn(async () => undefined)
const setSigner = vi.fn()
const fetchBalance = vi.fn(async () => ({ tUSDC: { free: 10_000, used: 0, total: 10_000 } }))

vi.mock("@somnia-chain/markets-sdk", () => ({
  isBinaryMarket: vi.fn(),
  SomniaMarkets: vi.fn(() => ({ loadMarkets, setSigner, fetchBalance, trader: { faucet }, close })),
}))

vi.mock("viem", async (importOriginal) => ({
  ...(await importOriginal<typeof import("viem")>()),
  createWalletClient: vi.fn(() => ({
    requestAddresses: vi.fn(async () => ["0x0000000000000000000000000000000000000001"]),
  })),
}))

import {
  browserExchange,
  browserPortfolio,
  estimateBuyExecution,
  faucetBrowserCollateral,
  orderExecution,
  portfolioFromBalances,
  readWithRpcFallback,
  sortMarketCandidates,
} from "./dreamdex"

describe("browserExchange", () => {
  beforeEach(() => {
    loadMarkets.mockClear()
    faucet.mockClear()
    close.mockClear()
    setSigner.mockClear()
    fetchBalance.mockClear()
  })

  it("loads the symbol registry before returning a wallet exchange", async () => {
    await browserExchange({ request: vi.fn(), on: vi.fn(), removeListener: vi.fn() })

    expect(loadMarkets).toHaveBeenCalledOnce()
    expect(setSigner).toHaveBeenCalledWith(expect.objectContaining({
      account: "0x0000000000000000000000000000000000000001",
    }))
  })

  it("claims test collateral through the DreamDEX faucet", async () => {
    const result = await faucetBrowserCollateral({ request: vi.fn(), on: vi.fn(), removeListener: vi.fn() })

    expect(faucet).toHaveBeenCalledOnce()
    expect(result.hash).toBe("0xabc")
    expect(close).toHaveBeenCalledOnce()
  })
})

describe("DreamDEX account views", () => {
  it("estimates a buy across executable ask depth", () => {
    expect(estimateBuyExecution([[0.6, 2], [0.7, 3]], 4)).toEqual({
      requested: 4,
      estimatedFill: 4,
      estimatedCost: 2.6,
      averagePrice: 0.65,
      sufficientLiquidity: true,
    })
    expect(estimateBuyExecution([[0.6, 2]], 4).sufficientLiquidity).toBe(false)
  })

  it("falls back to HTTP when the SDK WebSocket market read fails", async () => {
    const fallback = vi.fn(async () => ({ status: 1 }))

    await expect(readWithRpcFallback(async () => { throw new Error("WebSocket request failed") }, fallback)).resolves.toEqual({ status: 1 })
    expect(fallback).toHaveBeenCalledOnce()
  })

  it("selects the same market when BTC and ETH share an expiry", async () => {
    const btc = { symbol: "BTC", info: { expiry: 200, marketId: "0x02" } }
    const eth = { symbol: "ETH", info: { expiry: 200, marketId: "0x01" } }

    expect(sortMarketCandidates([btc, eth] as never[])[0]).toBe(eth)
    expect(sortMarketCandidates([eth, btc] as never[])[0]).toBe(eth)
  })

  it("summarizes a partial fill using receipt fills", async () => {
    const execution = orderExecution({
      amount: 2,
      filled: 1,
      remaining: 1,
      status: "canceled",
      price: 0.8,
      info: { fills: [{ quantityFilled: 1_000_000n, fillPrice: 720_000n }] },
    }, "UP")

    expect(execution).toEqual({ status: "PARTIAL", requested: 2, filled: 1, remaining: 1, averagePrice: 0.72 })
  })

  it("complements the YES fill price for a DOWN contract", async () => {
    const execution = orderExecution({
      amount: 1,
      filled: 1,
      remaining: 0,
      status: "closed",
      price: 0.3,
      info: { fills: [{ quantityFilled: 1_000_000n, fillPrice: 720_000n }] },
    }, "DOWN")

    expect(execution.averagePrice).toBe(0.28)
  })

  it("maps collateral and market outcomes from SDK balances", async () => {
    expect(portfolioFromBalances({
      tUSDC: { free: 9999.279, used: 0, total: 9999.279 },
      "ETH/tUSDC#YES": { free: 1, used: 0, total: 1 },
    }, { yesSymbol: "ETH/tUSDC#YES", noSymbol: "ETH/tUSDC#NO" })).toEqual({
      collateral: 9999.279,
      collateralCode: "tUSDC",
      upShares: 1,
      downShares: 0,
    })
  })

  it("reads a connected wallet portfolio and closes the exchange", async () => {
    fetchBalance.mockClear()
    close.mockClear()
    const result = await browserPortfolio(
      { request: vi.fn(), on: vi.fn(), removeListener: vi.fn() },
      { yesSymbol: "ETH/tUSDC#YES", noSymbol: "ETH/tUSDC#NO" },
    )

    expect(result.collateral).toBe(10_000)
    expect(fetchBalance).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })
})
