"use client"

import { useWalletSession } from "@/components/wallet-provider"

const shortWallet = (value: string) => `${value.slice(0, 5)}…${value.slice(-4)}`

export function SiteHeader({ active }: { active: "FORECASTS" | "AGENTS" | "REPUTATION" | "VERIFY" }) {
  const { wallet, state, message, connect, claimCollateral } = useWalletSession()
  const links = [
    ["FORECASTS", "/", "Live room"],
    ["AGENTS", "/agents", "Agents"],
    ["REPUTATION", "/reputation", "Track records"],
    ["VERIFY", "/verify", "Verify proof"],
  ] as const

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="DreamPulse home">
        <span className="brand-mark">D</span>
        <span><strong>DreamPulse</strong><small>Decision protocol</small></span>
      </a>
      <nav aria-label="Primary navigation">
        {links.map(([key, href, label]) => <a key={key} className={active === key ? "active" : ""} href={href}>{label}</a>)}
      </nav>
      <div className="header-actions">
        <span className="network-pill"><i /> Somnia testnet</span>
        <button className="header-faucet" onClick={claimCollateral} disabled={state === "CONNECTING" || state === "CLAIMING"} title={message}>{state === "CLAIMING" ? "Claiming…" : "10K tUSDC"}</button>
        <button className="header-cta" onClick={connect} disabled={state === "CONNECTING"} title={message}>{wallet ? shortWallet(wallet) : state === "CONNECTING" ? "Connecting…" : "Connect wallet"}<b>{wallet ? "✓" : "↗"}</b></button>
      </div>
    </header>
  )
}
