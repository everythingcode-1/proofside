import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { SiteHeader } from "./site-header"
import { WalletProvider } from "./wallet-provider"

describe("SiteHeader", () => {
  it("keeps all destinations available through a mobile navigation control", () => {
    const html = renderToStaticMarkup(<WalletProvider><SiteHeader active="FORECASTS" /></WalletProvider>)

    expect(html).toContain('aria-label="Mobile navigation"')
    expect(html).toContain("Agents")
    expect(html).toContain("Track records")
    expect(html).toContain("Verify proof")
  })

  it("renders wallet feedback in a live status region", () => {
    const html = renderToStaticMarkup(<WalletProvider><SiteHeader active="FORECASTS" /></WalletProvider>)

    expect(html).toContain('role="status"')
    expect(html).toContain('aria-live="polite"')
  })

  it("provides visible mobile labels for wallet and faucet actions", () => {
    const html = renderToStaticMarkup(<WalletProvider><SiteHeader active="FORECASTS" /></WalletProvider>)

    expect(html).toContain('class="mobile-action-label">Faucet')
    expect(html).toContain('class="mobile-action-label">Wallet')
  })
})
