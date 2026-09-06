import { PredictionRoom } from "@/components/prediction-room"
import { SiteHeader } from "@/components/site-header"
export default function Home() {
  return <main><SiteHeader active="FORECASTS" />
    <section id="page-content" tabIndex={-1} className="execution-section primary-execution"><div className="section-title execution-intro"><div><p className="eyebrow">Proofside · Prediction markets</p><h1>Prediction market dashboard</h1></div><p>Follow live DreamDEX odds, compare them with Somnia price data, and trade UP or DOWN from one screen.</p></div><PredictionRoom /></section>
    <footer className="simple-footer"><span><strong>Proofside</strong> is a non-custodial prediction-market interface for DreamDEX on Somnia.</span><span>Every wallet action is signed by you.</span></footer>
  </main>
}
