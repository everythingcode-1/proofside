import { PredictionRoom } from "@/components/prediction-room"
import { ReceiptCard } from "@/components/receipt-card"
import { SiteHeader } from "@/components/site-header"
import { getForecastStore } from "@/lib/forecast-store"
export default function Home() {
  const receipts = getForecastStore().listRecent(3)
  return <main><SiteHeader active="FORECASTS" />
    <section className="hero"><div><p className="eyebrow">Live human–agent decision rooms</p><h1>Know what changed.<br />Decide with control.</h1><p className="hero-copy">Agents monitor the market and challenge the thesis. You form the judgment, set the risk, and choose whether anything gets signed.</p></div><div className="hero-facts"><article><i className="blue" /><span>Live awareness</span><strong>What changed</strong><small>Market-linked evidence deltas</small></article><article><i className="green" /><span>Human control</span><strong>Private first view</strong><small>Reason before consensus</small></article><article><i className="amber" /><span>Action</span><strong>DreamDEX native</strong><small>Optional wallet-signed backing</small></article></div></section>
    {receipts.length > 0 && <section className="receipt-section"><div className="section-title"><p className="eyebrow">Latest receipts</p><h2>Claims with a memory.</h2></div><div className="receipt-grid">{receipts.map((receipt) => <ReceiptCard key={receipt.id} receipt={receipt} />)}</div></section>}
    <section className="execution-section"><div className="section-title"><p className="eyebrow">Live decision room</p><h2>Judge first. Challenge it. Then act.</h2><p>DreamDEX defines the outcome. Agents surface evidence and opposition. You retain the final signature.</p></div><PredictionRoom /></section>
    <footer><span>Settlement by <strong>DreamDEX</strong></span><span>Integrity proof by <strong>Somnia</strong></span><span>No custody. Every action is explicitly signed.</span></footer>
  </main>
}
