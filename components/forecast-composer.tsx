"use client"

import { useMemo, useState } from "react"
import type { EIP1193Provider } from "viem"
import { buildDecisionBrief, type DecisionSignal } from "@/lib/decision-brief"
import type { StoredForecast } from "@/lib/forecast-store"
import type { Direction, MarketView, RoomState } from "@/lib/types"
import { useWalletSession } from "@/components/wallet-provider"

type ForecastComposerProps = {
  market: MarketView
  direction: Direction
  onDirectionChange: (direction: Direction) => void
  signals: DecisionSignal[]
  room: RoomState
  baselineUpPrice: number | null
  onRevealChange: (revealed: boolean, baselineUpPrice: number | null) => void
  onReceipt?: (receipt: StoredForecast) => void
}

export function ForecastComposer({ market, direction, onDirectionChange, signals, room, baselineUpPrice, onRevealChange, onReceipt }: ForecastComposerProps) {
  const { wallet } = useWalletSession()
  const [confidence, setConfidence] = useState(65)
  const [firstJudgment, setFirstJudgment] = useState<Direction>(direction)
  const [firstConfidence, setFirstConfidence] = useState<number | null>(null)
  const [initialJudgmentAt, setInitialJudgmentAt] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [thesis, setThesis] = useState("")
  const [counterCase, setCounterCase] = useState("")
  const [invalidation, setInvalidation] = useState("")
  const [state, setState] = useState("IDLE")
  const [message, setMessage] = useState("Your first judgment stays on this device until you reveal the analysis.")
  const [receipt, setReceipt] = useState<StoredForecast | null>(null)

  const brief = useMemo(() => buildDecisionBrief({ market, previousUpPrice: baselineUpPrice, judgment: firstJudgment, signals }), [market, baselineUpPrice, firstJudgment, signals])
  const provider = () => (window as Window & { ethereum?: EIP1193Provider }).ethereum

  const reveal = () => {
    const judgedAt = Date.now()
    setFirstConfidence(confidence)
    setInitialJudgmentAt(judgedAt)
    onDirectionChange(firstJudgment)
    onRevealChange(true, market.upPrice)
    setRevealed(true)
    setMessage("Analysis revealed. Keep your judgment or revise it before signing.")
  }

  const publish = async () => {
    try {
      const account = wallet
      if (!account) throw new Error("Connect your wallet from the navbar before signing a receipt.")
      setState("REVIEWING"); setMessage("Preparing the exact decision receipt…")
      const fields = { creatorWallet: account, marketId: market.id, initialDirection: firstJudgment, initialConfidenceBps: (firstConfidence ?? confidence) * 100, initialJudgmentAt: initialJudgmentAt ?? Date.now(), direction, confidenceBps: confidence * 100, thesis, counterCase, invalidationCondition: invalidation }
      const challengeResponse = await fetch("/api/forecasts/challenge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) })
      const challenge = await challengeResponse.json(); if (!challengeResponse.ok) throw new Error(challenge.message)
      setState("SIGNING"); setMessage("Review and sign the Decision Receipt in your wallet.")
      const signature = await provider()!.request({ method: "eth_signTypedData_v4", params: [account, JSON.stringify(challenge.typedData)] }) as string
      setState("ANCHORING"); setMessage("Signature verified. Anchoring the receipt hash to Somnia…")
      const response = await fetch("/api/forecasts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, createdAt: challenge.payload.createdAt, signature }) })
      const result = await response.json(); if (!response.ok) throw new Error(result.message)
      setReceipt(result.receipt); onReceipt?.(result.receipt); setState(result.receipt.proofState); setMessage(result.receipt.proofState === "ANCHORED" ? "Decision receipt anchored on Somnia." : "Decision signed. On-chain anchoring is not configured yet.")
    } catch (error) { setState("ERROR"); setMessage(error instanceof Error ? error.message : "Publication failed.") }
  }

  return <section className="forecast-card decision-card" id="create" aria-labelledby="decision-heading">
    <div className="forecast-card-head">
      <p className="source-label dreampulse">Human decision lane</p>
      <h2 id="decision-heading">Decide before the crowd decides for you.</h2>
      <p>{revealed ? "Compare your independent view with live market and agent evidence." : "Your first answer is private. Market consensus and agent reasoning unlock afterward."}</p>
    </div>

    {!revealed ? <div className="composer-form first-judgment">
      <div className="decision-step"><span>01</span><strong>Private first judgment</strong><small>Not published · not traded</small></div>
      <div className="composer-direction">
        <button className={firstJudgment === "UP" ? "selected up" : "up"} onClick={() => setFirstJudgment("UP")}>▲ UP</button>
        <button className={firstJudgment === "DOWN" ? "selected down" : "down"} onClick={() => setFirstJudgment("DOWN")}>▼ DOWN</button>
      </div>
      <label>Initial confidence <strong>{confidence}%</strong><input type="range" min="1" max="99" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} /></label>
      <button className="trade-button" onClick={reveal}>Lock judgment & reveal analysis</button>
      <p className="privacy-note"><span>LOCAL</span> DreamPulse does not send this judgment until you explicitly sign a receipt.</p>
    </div> : <div className="composer-form decision-reveal">
      <div className="decision-step"><span>02</span><strong>Challenge the judgment</strong><small>First view: {firstJudgment} · {firstConfidence}%</small></div>

      <section className="change-brief"><small>What changed</small>{brief.changes.map((change) => <p key={change}>{change}</p>)}</section>
      <div className="comparison-strip">
        <div><small>Your first view</small><strong>{firstJudgment} {firstConfidence}%</strong></div>
        <div><small>DreamDEX market</small><strong>{brief.marketRead}</strong></div>
        <div><small>Room after reveal</small><strong>{room.upPercent}% UP · {room.downPercent}% DOWN</strong></div>
      </div>

      <div className="argument-grid">
        <section><small>Supporting claims</small>{brief.support.length ? brief.support.map((item) => <p key={item}>{item}</p>) : <p>No authenticated agent supports this side yet.</p>}</section>
        <section><small>Challenges</small>{brief.marketChallenge && <p>{brief.marketChallenge}</p>}{brief.counter.length ? brief.counter.map((item) => <p key={item}>{item}</p>) : !brief.marketChallenge && <p>No authenticated opposing agent claim yet. Do not treat silence as confirmation.</p>}</section>
      </div>

      <div className="decision-revision">
        <span>Final judgment</span>
        <div className="composer-direction"><button className={direction === "UP" ? "selected up" : "up"} onClick={() => onDirectionChange("UP")}>▲ UP</button><button className={direction === "DOWN" ? "selected down" : "down"} onClick={() => onDirectionChange("DOWN")}>▼ DOWN</button></div>
        {direction !== firstJudgment && <small className="revision-note">Revised after evidence · {firstJudgment} → {direction}</small>}
      </div>

      <label>Final confidence <strong>{confidence}%</strong><input type="range" min="1" max="99" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} /></label>
      <label>Why this decision?<textarea maxLength={560} value={thesis} onChange={(event) => setThesis(event.target.value)} placeholder="State the evidence that matters most." /></label>
      <label>Strongest counter-case<textarea maxLength={280} value={counterCase} onChange={(event) => setCounterCase(event.target.value)} placeholder="What is the best reason the other side could win?" /></label>
      <label>Invalidation trigger<textarea maxLength={280} value={invalidation} onChange={(event) => setInvalidation(event.target.value)} placeholder="What observable change would make you reconsider?" /></label>
      <button className="trade-button" onClick={publish} disabled={!market.isLive || ["SIGNING","ANCHORING"].includes(state)}>Sign decision receipt</button>
      <button className="reset-judgment" onClick={() => { setRevealed(false); setFirstJudgment(direction); setFirstConfidence(null); setInitialJudgmentAt(null); onRevealChange(false, market.upPrice); setMessage("Your first judgment stays on this device until you reveal the analysis.") }}>Start a fresh judgment</button>
      <p className={`composer-message ${state.toLowerCase()}`} aria-live="polite">{message}</p>
      {receipt && <a className="receipt-link" href={`/forecasts/${receipt.id}`}>Open verifiable receipt →</a>}
    </div>}
  </section>
}
