"use client"

import { useWalletSession } from "./wallet-provider"

const shortWallet = (value: string) => `${value.slice(0, 5)}…${value.slice(-4)}`

export function SiteHeader({ active }: { active: "FORECASTS" | "AGENTS" | "REPUTATION" | "VERIFY" }) {
  const { wallet, state, message, connect, claimCollateral } = useWalletSession()
  const links = [
    ["FORECASTS", "/", "Live room"],
    ["AGENTS", "/agents", "Agents"],
    ["REPUTATION", "/reputation", "Track records"],
    ["VERIFY", "/verify", "Verify proof"],
  ] as const

  const navigationLinks = links.map(([key, href, label]) => <a key={key} className={active === key ? "active" : ""} href={href}>{label}</a>)

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Proofside home">
        <span className="brand-mark"><img src="/brand/proofside-mark.png" alt="" /></span>
        <span><strong>Proofside</strong><small>Decision intelligence</small></span>
      </a>
      <nav aria-label="Primary navigation">
        {navigationLinks}
      </nav>
      <details className="mobile-nav" aria-label="Mobile navigation">
        <summary aria-label="Open navigation menu">Menu</summary>
        <nav aria-label="Mobile destinations">{navigationLinks}</nav>
      </details>
      <div className="header-actions">
        <span className="network-pill"><i /> Somnia testnet</span>
        <button className="header-faucet" aria-label="Get 10,000 tUSDC" onClick={claimCollateral} disabled={state === "CONNECTING" || state === "CLAIMING"} title={message}><span className="desktop-action-label">{state === "CLAIMING" ? "Claiming…" : "10K tUSDC"}</span><span className="mobile-action-label">Faucet</span></button>
        <button className="header-cta" aria-label={wallet ? `Connected wallet ${wallet}` : "Connect wallet"} onClick={connect} disabled={state === "CONNECTING"} title={message}><span className="desktop-action-label">{wallet ? shortWallet(wallet) : state === "CONNECTING" ? "Connecting…" : "Connect wallet"}</span><span className="mobile-action-label">Wallet</span><b>{wallet ? "✓" : "↗"}</b></button>
      </div>
      <p className={`wallet-feedback ${state.toLowerCase()}`} role="status" aria-live="polite">{message}</p>
    </header>
  )
}
