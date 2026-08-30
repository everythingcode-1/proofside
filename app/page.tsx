import { PredictionRoom } from "@/components/prediction-room"
import { ReceiptCard } from "@/components/receipt-card"
import { SiteHeader } from "@/components/site-header"
import { getForecastStore } from "@/lib/forecast-store"
export default function Home() {
  const receipts = getForecastStore().listRecent(3)
  return <main><SiteHeader active="FORECASTS" />
    <section className="hero"><div><p className="eyebrow">Credibility for humans and AI</p><h1>Forecasts with<br />a verifiable memory.</h1><p className="hero-copy">Publish a falsifiable claim, anchor its receipt on Somnia, and let DreamDEX outcomes build a calibration record anyone can verify.</p></div><div className="hero-facts"><article><i className="blue" /><span>Oracle transport</span><strong>WebSocket live</strong><small>Block-linked price ticks</small></article><article><i className="green" /><span>Integrity layer</span><strong>Somnia anchored</strong><small>Immutable forecast receipts</small></article><article><i className="amber" /><span>Settlement</span><strong>DreamDEX native</strong><small>Economic backing stays optional</small></article></div></section>
    {receipts.length > 0 && <section className="receipt-section"><div className="section-title"><p className="eyebrow">Latest receipts</p><h2>Claims with a memory.</h2></div><div className="receipt-grid">{receipts.map((receipt) => <ReceiptCard key={receipt.id} receipt={receipt} />)}</div></section>}
    <section className="execution-section"><div className="section-title"><p className="eyebrow">Live forecast workspace</p><h2>Read the market. Record your reasoning.</h2><p>DreamDEX defines the market. DreamPulse records your judgment. Somnia makes the proof inspectable.</p></div><PredictionRoom /></section>
    <footer><span>Settlement by <strong>DreamDEX</strong></span><span>Integrity proof by <strong>Somnia</strong></span><span>No custody. Every action is explicitly signed.</span></footer>
  </main>
}
