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

describe("browserExchange", () => {
  beforeEach(() => {
    loadMarkets.mockClear()
    faucet.mockClear()
    close.mockClear()
    setSigner.mockClear()
    fetchBalance.mockClear()
  })

  it("loads the symbol registry before returning a wallet exchange", async () => {
    const { browserExchange } = await import("./dreamdex")
    await browserExchange({ request: vi.fn(), on: vi.fn(), removeListener: vi.fn() })

    expect(loadMarkets).toHaveBeenCalledOnce()
    expect(setSigner).toHaveBeenCalledWith(expect.objectContaining({
      account: "0x0000000000000000000000000000000000000001",
    }))
  })

  it("claims test collateral through the DreamDEX faucet", async () => {
    const { faucetBrowserCollateral } = await import("./dreamdex")
    const result = await faucetBrowserCollateral({ request: vi.fn(), on: vi.fn(), removeListener: vi.fn() })

    expect(faucet).toHaveBeenCalledOnce()
    expect(result.hash).toBe("0xabc")
    expect(close).toHaveBeenCalledOnce()
  })
})

describe("DreamDEX account views", () => {
  it("summarizes a partial fill using receipt fills", async () => {
    const { orderExecution } = await import("./dreamdex")
    const execution = orderExecution({
      amount: 2,
      filled: 1,
      remaining: 1,
      status: "canceled",
      price: 0.8,
      info: { fills: [{ quantityFilled: 1_000_000n, fillPrice: 720_000n }] },
    })

    expect(execution).toEqual({ status: "PARTIAL", requested: 2, filled: 1, remaining: 1, averagePrice: 0.72 })
  })

  it("maps collateral and market outcomes from SDK balances", async () => {
    const { portfolioFromBalances } = await import("./dreamdex")
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
    const { browserPortfolio } = await import("./dreamdex")
    const result = await browserPortfolio(
      { request: vi.fn(), on: vi.fn(), removeListener: vi.fn() },
      { yesSymbol: "ETH/tUSDC#YES", noSymbol: "ETH/tUSDC#NO" },
    )

    expect(result.collateral).toBe(10_000)
    expect(fetchBalance).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })
})
