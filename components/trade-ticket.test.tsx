import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { TradeTicket } from "./trade-ticket"

const baseProps = {
  wallet: null,
  direction: "UP" as const,
  upPrice: 0.72,
  downPrice: 0.28,
  shares: "2",
  maxLoss: 1.44,
  portfolio: null,
  executionEstimate: null,
  marketLive: true,
  executionBlocked: false,
  tradePending: false,
  tradeMessage: "Connect wallet from the navbar to execute.",
  tradeState: "IDLE" as const,
  tradeProof: null,
  activities: [],
  marketId: "0xmarket",
  contractAddress: "0xpool",
  attribution: null,
  onDirectionChange: vi.fn(),
  onSharesChange: vi.fn(),
  onAddConviction: vi.fn(),
  onTrade: vi.fn(),
}

describe("TradeTicket", () => {
  it("shows executable choices and risk before wallet connection", () => {
    const html = renderToStaticMarkup(<TradeTicket {...baseProps} />)

    expect(html).toContain("▲ UP")
    expect(html).toContain("▼ DOWN")
    expect(html).toContain("72¢")
    expect(html).toContain("28¢")
    expect(html).toContain("Maximum loss")
    expect(html).toContain("Connect wallet to trade")
    expect(html).not.toContain("Decide before the crowd")
  })

  it("enables the selected trade path without a receipt", () => {
    const html = renderToStaticMarkup(
      <TradeTicket
        {...baseProps}
        wallet="0x1234567890123456789012345678901234567890"
        direction="DOWN"
      />,
    )

    expect(html).toContain("Trade DOWN on DreamDEX")
    const tradeButton = html.match(/<button[^>]*aria-label="Trade DOWN on DreamDEX"[^>]*>/)?.[0]
    expect(tradeButton).toBeTruthy()
    expect(tradeButton).not.toContain("disabled")
    expect(html).not.toContain("Decide before the crowd")
  })

  it("warns before an unauthenticated preview exceeds the standard test collateral", () => {
    const html = renderToStaticMarkup(
      <TradeTicket {...baseProps} shares="1000000" maxLoss={720000} />,
    )

    expect(html).toContain("exceeds the standard 10,000 tUSDC test balance")
  })

  it("warns about snapshot collateral without blocking a freshly quoted preflight", () => {
    const html = renderToStaticMarkup(
      <TradeTicket
        {...baseProps}
        wallet="0x1234567890123456789012345678901234567890"
        portfolio={{ collateral: 1, collateralCode: "tUSDC", upShares: 0, downShares: 0 }}
        maxLoss={1.44}
      />,
    )

    expect(html).toContain("Insufficient tUSDC collateral")
    const tradeButton = html.match(/<button[^>]*aria-label="Trade UP on DreamDEX"[^>]*>/)?.[0]
    expect(tradeButton).not.toContain("disabled")
    expect(html).toContain('aria-describedby="sizing-message"')
  })
})
