"use client"
import { useState } from "react"
import type { EIP1193Provider } from "viem"
import type { StoredForecast } from "@/lib/forecast-store"
import type { Direction, MarketView } from "@/lib/types"

type ForecastComposerProps = {
  market: MarketView
  onReceipt?: (receipt: StoredForecast) => void
}

export function ForecastComposer({ market, onReceipt }: ForecastComposerProps) {
  const [wallet, setWallet] = useState<`0x${string}` | null>(null)
  const [direction, setDirection] = useState<Direction>("UP"), [confidence, setConfidence] = useState(65)
  const [thesis, setThesis] = useState(""), [counterCase, setCounterCase] = useState(""), [invalidation, setInvalidation] = useState("")
  const [state, setState] = useState("IDLE"), [message, setMessage] = useState("A forecast becomes public only after you review and sign it.")
  const [receipt, setReceipt] = useState<StoredForecast | null>(null)
  const provider = () => (window as Window & { ethereum?: EIP1193Provider }).ethereum
  const connect = async () => { const injected = provider(); if (!injected) throw new Error("No EVM wallet found."); const accounts = await injected.request({ method: "eth_requestAccounts" }) as `0x${string}`[]; if (!accounts[0]) throw new Error("No wallet selected."); setWallet(accounts[0]); return accounts[0] }
  const publish = async () => {
    try {
      if (!market) throw new Error("No live DreamDEX market.")
      const account = wallet ?? await connect(); setState("REVIEWING"); setMessage("Preparing the exact receipt…")
      const fields = { creatorWallet: account, marketId: market.id, direction, confidenceBps: confidence * 100, thesis, counterCase, invalidationCondition: invalidation }
      const challengeResponse = await fetch("/api/forecasts/challenge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) })
      const challenge = await challengeResponse.json(); if (!challengeResponse.ok) throw new Error(challenge.message)
      setState("SIGNING"); setMessage("Review and sign the Forecast Receipt in your wallet.")
      const signature = await provider()!.request({ method: "eth_signTypedData_v4", params: [account, JSON.stringify(challenge.typedData)] }) as string
      setState("ANCHORING"); setMessage("Signature verified. Anchoring the receipt hash to Somnia…")
      const response = await fetch("/api/forecasts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, createdAt: challenge.payload.createdAt, signature }) })
      const result = await response.json(); if (!response.ok) throw new Error(result.message)
      setReceipt(result.receipt); onReceipt?.(result.receipt); setState(result.receipt.proofState); setMessage(result.receipt.proofState === "ANCHORED" ? "Receipt anchored on Somnia." : "Receipt signed. On-chain anchoring is not configured yet.")
    } catch (error) { setState("ERROR"); setMessage(error instanceof Error ? error.message : "Publication failed.") }
  }
  return <section className="forecast-card" id="create" aria-labelledby="forecast-heading">
    <div className="forecast-card-head"><p className="source-label dreampulse">DreamPulse forecast receipt</p><h2 id="forecast-heading">Make your judgment accountable.</h2><p>Confidence is scored after DreamDEX settlement. Trading remains optional.</p></div>
    <div className="composer-form"><div className="composer-market"><span>DreamDEX canonical market</span><strong>{market.question}</strong></div><div className="composer-direction"><button className={direction === "UP" ? "selected up" : "up"} onClick={() => setDirection("UP")}>▲ UP</button><button className={direction === "DOWN" ? "selected down" : "down"} onClick={() => setDirection("DOWN")}>▼ DOWN</button></div><label>Confidence <strong>{confidence}%</strong><input type="range" min="1" max="99" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} /></label><label>Thesis<textarea maxLength={560} value={thesis} onChange={(event) => setThesis(event.target.value)} placeholder="Why should this outcome happen?" /></label><label>Counter-case<textarea maxLength={280} value={counterCase} onChange={(event) => setCounterCase(event.target.value)} placeholder="What is the strongest opposing case?" /></label><label>Invalidation condition<textarea maxLength={280} value={invalidation} onChange={(event) => setInvalidation(event.target.value)} placeholder="What evidence would make this thesis wrong?" /></label><button className="trade-button" onClick={publish} disabled={!market.isLive || ["SIGNING","ANCHORING"].includes(state)}>Review & sign forecast</button><p className={`composer-message ${state.toLowerCase()}`} aria-live="polite">{message}</p>{receipt && <a className="receipt-link" href={`/forecasts/${receipt.id}`}>Open verifiable receipt →</a>}</div>
  </section>
}
