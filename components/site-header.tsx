"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useWalletSession } from "./wallet-provider"

const shortWallet = (value: string) => `${value.slice(0, 5)}…${value.slice(-4)}`

const navigationIcons = {
  FORECASTS: "M4 17V7m5 10v-5m5 5V4m5 13V9M3 21h18",
  AGENTS: "M8 5V3m8 2V3M5 8h14v12H5zM9 12h.01M15 12h.01M9 16h6M2 11v5m20-5v5",
  REPUTATION: "M8 3h8v7a4 4 0 0 1-8 0zM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v5m-4 2h8",
  VERIFY: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6",
}

export function SiteHeader({ active }: { active: "FORECASTS" | "AGENTS" | "REPUTATION" | "VERIFY" }) {
  const { wallet, state, message, connect, claimCollateral } = useWalletSession()
  const menuRef = useRef<HTMLDetailsElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

  useEffect(() => {
    // Native disclosure can be opened before hydration finishes.
    setMenuOpen(menuRef.current?.open ?? false)
    const close = () => { if (menuRef.current) menuRef.current.open = false }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) close()
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuRef.current?.open) {
        close()
        menuRef.current.querySelector("summary")?.focus()
      }
    }
    const desktop = window.matchMedia("(min-width: 901px)")
    const resize = () => { if (desktop.matches) close() }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", escape)
    desktop.addEventListener("change", resize)
    return () => {
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", escape)
      desktop.removeEventListener("change", resize)
    }
  }, [])
  const links = [
    ["FORECASTS", "/", "Live market"],
    ["AGENTS", "/agents", "Agents"],
    ["REPUTATION", "/reputation", "Track records"],
    ["VERIFY", "/verify", "Verify proof"],
  ] as const

  const navigationLinks = links.map(([key, href, label]) => <a key={key} className={active === key ? "active" : ""} aria-current={active === key ? "page" : undefined} href={href}>{label}</a>)

  return (<>
    <a className="skip-link" href="#page-content">Skip to main content</a>
    <header className="site-header">
      <a className="brand" href="/" aria-label="Proofside home">
        <span className="brand-mark"><img src="/brand/proofside-mark.svg" alt="" /></span>
        <span><strong>Proofside</strong><small>Prediction markets</small></span>
      </a>
      <span className="header-context">Prediction markets <span>/</span> {links.find(([key]) => key === active)?.[2]}</span>
      <div className="header-actions">
        <span className="network-pill"><i /> Somnia testnet</span>
        <button className="header-faucet" aria-label="Get 10,000 tUSDC" onClick={claimCollateral} disabled={state === "CONNECTING" || state === "CLAIMING"} title={message}><span className="desktop-action-label">{state === "CLAIMING" ? "Claiming…" : "10K tUSDC"}</span><span className="mobile-action-label">Faucet</span></button>
        <button className="header-cta" aria-label={wallet ? `Connected wallet ${wallet}` : "Connect wallet"} onClick={connect} disabled={state === "CONNECTING"} title={message}><span className="desktop-action-label">{wallet ? shortWallet(wallet) : state === "CONNECTING" ? "Connecting…" : "Connect wallet"}</span><span className="mobile-action-label">Wallet</span><b aria-hidden="true">{wallet
          ? <svg viewBox="0 0 20 20" width="13" height="13" fill="none"><path d="m4 10 4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : <svg viewBox="0 0 20 20" width="13" height="13" fill="none"><path d="M6 14 14 6m-6 0h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        }</b></button>
      </div>
      <details ref={menuRef} suppressHydrationWarning className="mobile-nav" aria-label="Mobile navigation"
        onToggle={(event) => setMenuOpen(event.currentTarget.open)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false
        }}>
        <summary aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-controls={menuId}>
          <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path className="menu-lines" d="M4 6h16M4 12h16M4 18h16" />
            <path className="menu-cross" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </summary>
        <nav id={menuId} aria-label="Mobile destinations" onClick={(event) => {
          if ((event.target as Element).closest("a") && menuRef.current) menuRef.current.open = false
        }}>
          <span className="mobile-nav-caption">Explore Proofside</span>
          {navigationLinks}
        </nav>
      </details>
      <p className={`wallet-feedback ${state.toLowerCase()}`} role="status" aria-live="polite">{message}</p>
    </header>
    <nav className="desktop-rail" aria-label="Primary navigation">
      {links.map(([key, href, label]) => <a key={key} href={href} aria-label={label} aria-current={active === key ? "page" : undefined} className={active === key ? "active" : ""}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={navigationIcons[key]} /></svg>
        <span>{label}</span>
      </a>)}
    </nav>
    </>
  )
}
