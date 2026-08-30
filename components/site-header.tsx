export function SiteHeader({ active }: { active: "FORECASTS" | "AGENTS" | "REPUTATION" | "VERIFY" }) {
  const links = [
    ["FORECASTS", "/", "Forecasts"],
    ["AGENTS", "/agents", "Agents"],
    ["REPUTATION", "/reputation", "Reputation"],
    ["VERIFY", "/verify", "Verify proof"],
  ] as const

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="DreamPulse home">
        <span className="brand-mark">D</span>
        <span><strong>DreamPulse</strong><small>Credibility protocol</small></span>
      </a>
      <nav aria-label="Primary navigation">
        {links.map(([key, href, label]) => <a key={key} className={active === key ? "active" : ""} href={href}>{label}</a>)}
      </nav>
      <div className="header-actions">
        <span className="network-pill"><i /> Somnia testnet</span>
        <a className="header-cta" href="/#create">Create forecast <b>+</b></a>
      </div>
    </header>
  )
}
