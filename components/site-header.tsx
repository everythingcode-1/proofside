export function SiteHeader({ active }: { active: "FORECASTS" | "AGENTS" | "REPUTATION" | "VERIFY" }) {
  const links = [
    ["FORECASTS", "/", "✦", "Forecasts"],
    ["AGENTS", "/agents", "◎", "Agents"],
    ["REPUTATION", "/reputation", "⌁", "Reputation"],
    ["VERIFY", "/verify", "◇", "Verify proof"],
  ] as const
  return <>
    <aside className="site-header">
      <a className="brand" href="/"><span className="brand-mark">D</span><span><strong>DreamPulse</strong><small>Credibility protocol</small></span></a>
      <nav>{links.map(([key, href, icon, label]) => <a key={key} className={active === key ? "active" : ""} href={href}><i>{icon}</i>{label}</a>)}</nav>
      <div className="sidebar-note"><span>Protocol status</span><strong><i /> All systems live</strong><small>DreamDEX · Somnia</small></div>
      <div className="network-pill"><span /> Somnia testnet</div>
    </aside>
    <div className="workspace-bar"><div><small>Workspace</small><strong>{links.find(([key]) => key === active)?.[3]}</strong></div><div className="workspace-actions"><span className="secure-pill">◇ Verifiable by design</span><a href="#create">Create forecast <b>+</b></a></div></div>
  </>
}
