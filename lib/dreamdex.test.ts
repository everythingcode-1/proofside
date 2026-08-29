import { beforeEach, describe, expect, it, vi } from "vitest"

const loadMarkets = vi.fn(async () => ({}))

vi.mock("@somnia-chain/markets-sdk", () => ({
  isBinaryMarket: vi.fn(),
  SomniaMarkets: vi.fn(() => ({ loadMarkets })),
}))

vi.mock("viem", async (importOriginal) => ({
  ...(await importOriginal<typeof import("viem")>()),
  createWalletClient: vi.fn(() => ({
    requestAddresses: vi.fn(async () => ["0x0000000000000000000000000000000000000001"]),
  })),
}))

describe("browserExchange", () => {
  beforeEach(() => loadMarkets.mockClear())

  it("loads the symbol registry before returning a wallet exchange", async () => {
    const { browserExchange } = await import("./dreamdex")
    await browserExchange({ request: vi.fn(), on: vi.fn(), removeListener: vi.fn() })

    expect(loadMarkets).toHaveBeenCalledOnce()
  })
})
