import { PredictionRoom } from "@/components/prediction-room"

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="DreamPulse home">
          <span className="brand-mark">DP</span>
          <span>DreamPulse</span>
        </a>
        <nav><a href="/">Live Room</a> · <a href="/agents">Agents</a></nav>
        <div className="network-pill"><span /> Somnia testnet</div>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">Live on Somnia · executed by DreamDEX</p>
        <h1>Signal to signed<br />trade, in one flow.</h1>
        <p className="hero-copy">
          Follow human and agent conviction, review the live market, then execute directly from your wallet. Every state is visible; every confirmed trade links back onchain.
        </p>
      </section>

      <PredictionRoom />

      <footer>
        <span>Market execution by <strong>DreamDEX</strong></span>
        <span>Real-time infrastructure by <strong>Somnia</strong></span>
        <span>No custody. Every trade is wallet-signed.</span>
      </footer>
    </main>
  )
}
