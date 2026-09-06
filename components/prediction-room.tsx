"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { EIP1193Provider } from "viem"
import { DREAMDEX } from "@/lib/config"
import { browserPortfolio, placeBrowserOrder, watchMarketBook, type ExecutionEstimate, type PortfolioView } from "@/lib/dreamdex"
import { countdownLabel, durationLabel } from "@/lib/format"
import { freshnessState, type FreshnessState } from "@/lib/realtime"
import type { TransactionState } from "@/lib/transactions"
import type { Direction, MarketView, RoomState, TradeProof } from "@/lib/types"
import { speedLabel } from "@/lib/pulse-ui"
import { MarketOracleChart } from "@/components/market-oracle-chart"
import { marketRefreshDelay } from "@/lib/live-refresh"
import { ForecastComposer } from "@/components/forecast-composer"
import { ReceiptCard } from "@/components/receipt-card"
import { TradeTicket } from "@/components/trade-ticket"
import { useWalletSession } from "@/components/wallet-provider"
import type { StoredForecast } from "@/lib/forecast-store"

type MarketResponse = { market?: MarketView; error?: string; fetchedAt: number }
type Activity = { kind: "FAUCET" | "ORDER"; hash: `0x${string}`; detail: string }
type AgentSignal = { id: string; actorId: string; direction: Direction; confidence: number | null; reason: string; agent: { name: string; framework: string } }
type ReferenceAgent = { direction: Direction; confidenceBps: number; thesis: string; evidence: { observedAt: number }; proofState: string; receiptId: string }

const emptyRoom = (roomId = "pending"): RoomState => ({
  roomId,
  participants: 0,
  up: 0,
  down: 0,
  upPercent: 50,
  downPercent: 50,
})

const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`

export function PredictionRoom() {
  const { wallet, activityNonce } = useWalletSession()
  const [market, setMarket] = useState<MarketView | null>(null)
  const [room, setRoom] = useState<RoomState>(emptyRoom())
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<Direction>("UP")
  const [shares, setShares] = useState("1")
  const [tradeProof, setTradeProof] = useState<TradeProof | null>(null)
  const [tradeState, setTradeState] = useState<TransactionState>("IDLE")
  const [tradeMessage, setTradeMessage] = useState("Explore both sides now. Connect a wallet only when you are ready to execute.")
  const [now, setNow] = useState(Date.now())
  const [streamState, setStreamState] = useState<FreshnessState>("OFFLINE")
  const [lastVerifiedAt, setLastVerifiedAt] = useState<number | null>(null)
  const [previousMarketId, setPreviousMarketId] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioView | null>(null)
  const [executionEstimate, setExecutionEstimate] = useState<ExecutionEstimate | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [signals, setSignals] = useState<AgentSignal[]>([])
  const [referenceAgent, setReferenceAgent] = useState<ReferenceAgent | null>(null)
  const [referenceBusy, setReferenceBusy] = useState(false)
  const [attribution, setAttribution] = useState<{ agent: string; signal: string; name?: string } | null>(null)
  const [verificationMs, setVerificationMs] = useState<number | null>(null)
  const [createdReceipt, setCreatedReceipt] = useState<StoredForecast | null>(null)
  const [decisionLabOpen, setDecisionLabOpen] = useState(false)
  const [decisionBaseline, setDecisionBaseline] = useState<{ marketId: string; upPrice: number | null } | null>(null)
  const actionStartedAt = useRef<number | null>(null)
  const marketRef = useRef<MarketView | null>(null)
  const refreshingMarket = useRef(false)

  useEffect(() => { marketRef.current = market }, [market])
  useEffect(() => {
    if (market && decisionBaseline?.marketId !== market.id) setDecisionBaseline({ marketId: market.id, upPrice: market.upPrice })
  }, [market, decisionBaseline?.marketId])

  const refresh = useCallback(async () => {
    if (refreshingMarket.current) return
    refreshingMarket.current = true
    try {
      const response = await fetch("/api/market", { cache: "no-store" })
      const payload = (await response.json()) as MarketResponse
      if (!response.ok || !payload.market) {
        setError(payload.error || "DreamDEX market is unavailable.")
        return
      }
      setError(null)
      const previousMarket = marketRef.current
      if (previousMarket && previousMarket.id !== payload.market.id) {
        setPreviousMarketId(previousMarket.id)
        setRoom(emptyRoom(payload.market.id))
        setSignals([])
        setReferenceAgent(null)
        setAttribution(null)
        setDecisionLabOpen(false)
        setCreatedReceipt(null)
      }
      marketRef.current = payload.market
      setMarket(payload.market)
      setLastVerifiedAt(payload.fetchedAt)
      const [roomResponse, signalResponse] = await Promise.all([
        fetch(`/api/rooms/${payload.market.id}`, { cache: "no-store" }),
        fetch(`/api/markets/${payload.market.id}/signals`, { cache: "no-store" }),
      ])
      if (marketRef.current?.id === payload.market.id && roomResponse.ok) setRoom((await roomResponse.json()) as RoomState)
      if (marketRef.current?.id === payload.market.id && signalResponse.ok) setSignals(((await signalResponse.json()) as { signals: AgentSignal[] }).signals)
    } catch {
      setStreamState("RECONNECTING")
      setError("Proofside is reconnecting to its server and DreamDEX.")
    } finally {
      refreshingMarket.current = false
    }
  }, [])

  useEffect(() => {
    let stopped = false
    let marketTimer: number | undefined
    const schedule = async () => {
      await refresh()
      if (stopped) return
      marketTimer = window.setTimeout(schedule, marketRefreshDelay(marketRef.current?.locksAt ?? null, Date.now()))
    }
    void schedule()
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => {
      stopped = true
      if (marketTimer) window.clearTimeout(marketTimer)
      window.clearInterval(clockTimer)
    }
  }, [refresh])

  useEffect(() => {
    if (!market) return
    let stop: (() => Promise<void>) | undefined
    stop = watchMarketBook(
      market,
      (update) => {
        setMarket((current) => current?.id === market.id ? { ...current, upPrice: update.upPrice, downPrice: update.downPrice } : current)
        setLastVerifiedAt(update.verifiedAt)
      },
      setStreamState,
    )
    return () => { void stop?.() }
  }, [market?.id])

  useEffect(() => {
    if (!market) return
    const query = new URLSearchParams(window.location.search)
    if (query.get("market")?.toLowerCase() !== market.id.toLowerCase()) return
    const selected = signals.find((signal) => signal.id === query.get("signal") && signal.actorId === query.get("agent"))
    const linkedDirection = query.get("direction")
    if (selected && (linkedDirection === "UP" || linkedDirection === "DOWN")) setAttribution({ agent: selected.actorId, signal: selected.id, name: selected.agent.name })
  }, [market?.id, signals])

  const freshness = freshnessState({
    connected: streamState === "LIVE",
    retrying: streamState === "RECONNECTING",
    hasSnapshot: Boolean(market),
    lastVerifiedAt,
    now,
  })
  const hasFreshFallback = freshness === "RECONNECTING" && lastVerifiedAt && now - lastVerifiedAt <= 20_000
  const displayedFreshness = hasFreshFallback ? "POLLING" : freshness
  const freshnessLabel = hasFreshFallback
    ? "LIVE · POLLING FALLBACK"
    : freshness

  const provider = () => (window as Window & { ethereum?: EIP1193Provider }).ethereum

  const refreshPortfolio = async (account: `0x${string}`, currentMarket = market) => {
    const injected = provider()
    if (!injected || !currentMarket || !account) return
    try {
      setPortfolio(await browserPortfolio(injected, currentMarket))
    } catch {
      // A portfolio read must never turn a confirmed write into a failed trade.
    }
  }

  useEffect(() => {
    if (!wallet || !market) return
    setPortfolio(null)
    void refreshPortfolio(wallet, market)
  }, [wallet, market?.id, activityNonce])

  useEffect(() => {
    const amount = Number(shares)
    if (!market || !Number.isFinite(amount) || amount <= 0) { setExecutionEstimate(null); return }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/markets/${market.id}/quote?direction=${direction}&shares=${amount}`, { cache: "no-store", signal: controller.signal }).catch(() => null)
      if (!response?.ok) return setExecutionEstimate(null)
      setExecutionEstimate(((await response.json()) as { estimate: ExecutionEstimate }).estimate)
    }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [market?.id, direction, shares])

  const submitConviction = async () => {
    if (!market?.isLive) return
    const account = wallet
    if (!account) { setTradeState("BLOCKED"); setTradeMessage("Connect your wallet from the navbar first."); return }
    const response = await fetch(`/api/rooms/${market.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: account, direction }),
    })
    const payload = await response.json()
    if (!response.ok) {
      setTradeState("BLOCKED")
      setTradeMessage(payload.error || "Conviction could not be recorded.")
      return
    }
    setRoom(payload as RoomState)
    setTradeMessage(`Your ${direction} conviction is in the room. This is not a trade yet.`)
  }

  const refreshReferenceAgent = async () => {
    if (!market || referenceBusy) return
    setReferenceBusy(true)
    try {
      const response = await fetch(`/api/agent/reference/${market.id}`, { method: "POST" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || "Reference agent is unavailable.")
      setReferenceAgent({ ...payload.forecast, proofState: payload.receipt.proofState, receiptId: payload.receipt.id })
    } catch (reason) {
      setTradeMessage(reason instanceof Error ? reason.message : "Reference agent is unavailable.")
    } finally {
      setReferenceBusy(false)
    }
  }

  const trade = async () => {
    if (!market?.isLive) return
    if (["STALE", "OFFLINE"].includes(freshness)) {
      setTradeState("BLOCKED")
      setTradeMessage("Market data is stale. Wait for Proofside to reconnect before trading.")
      return
    }
    const injected = provider()
    const account = wallet
    if (!injected || !account) { setTradeState("BLOCKED"); setTradeMessage("Connect your wallet from the navbar first."); return }
    const amount = Number(shares)
    if (!Number.isFinite(amount) || amount <= 0) {
      setTradeState("BLOCKED")
      setTradeMessage("Enter a share amount greater than zero.")
      return
    }
    setTradeState("PREFLIGHT")
    actionStartedAt.current = performance.now()
    setTradeMessage("Checking market status, quote, and gas balance…")
    try {
      const result = await placeBrowserOrder({
        provider: injected,
        market,
        direction,
        shares: amount,
        onState: (state) => {
          setTradeState(state)
          if (state === "AWAITING_SIGNATURE") setTradeMessage("Confirm the DreamDEX IOC order in your wallet…")
          if (state === "SUBMITTED") setTradeMessage("Order submitted. Waiting for confirmation…")
        },
      })
      const proof: TradeProof = {
        hash: result.hash,
        explorerUrl: `${DREAMDEX.explorerUrl}/tx/${result.hash}`,
        status: "confirmed",
      }
      setTradeProof(proof)
      setTradeState("CONFIRMED")
      setVerificationMs(actionStartedAt.current === null ? null : performance.now() - actionStartedAt.current)
      const execution = result.execution
      const price = execution.averagePrice === null ? "" : ` at ${(execution.averagePrice * 100).toFixed(1)}¢`
      setTradeMessage(
        execution.status === "FILLED"
          ? `FILLED · ${execution.filled} ${direction} contract${execution.filled === 1 ? "" : "s"}${price}.`
          : execution.status === "PARTIAL"
            ? `PARTIAL · ${execution.filled} of ${execution.requested} contracts filled${price}.`
            : "UNFILLED · The IOC transaction confirmed but found no executable liquidity.",
      )
      setActivities((current) => [{
        kind: "ORDER",
        hash: result.hash,
        detail: `${execution.status} · ${execution.filled}/${execution.requested} ${direction}${price}`,
      }, ...current])
      await refreshPortfolio(account)
      const response = await fetch(`/api/rooms/${market.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: account, direction, transactionHash: result.hash }),
      })
      if (response.ok) setRoom((await response.json()) as RoomState)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The DreamDEX order failed."
      const cancelled = /rejected|denied|cancel/i.test(message)
      const reverted = /revert/i.test(message)
      setTradeState(cancelled ? "CANCELLED" : reverted ? "REVERTED" : "BLOCKED")
      setTradeMessage(message)
    }
  }

  if (!market && !error) {
    return (
      <section className="room-shell dashboard-loading" aria-live="polite" aria-busy="true">
        <div className="market-status-bar loading-status" aria-label="Loading live market status">
          <div><small>Live market</small><strong>Connecting…</strong></div>
          <div><small>Somnia network</small><strong>50312</strong></div>
          <div><small>Market update</small><strong>Reading chain…</strong></div>
          <div><small>Wallet</small><strong>Not connected</strong></div>
        </div>
        <section className="market-overview loading-overview" aria-label="Loading live market overview">
          <article className="overview-feature"><p>Current event contract</p><strong>Opening the next room…</strong><span>Reading active DreamDEX Event Contracts from Somnia.</span><small>Verified market data will appear here.</small></article>
          {["YES price", "NO price", "Room reading"].map((label) => <article className="overview-stat" key={label}><p>{label}</p><span className="skeleton-line wide" /><span className="skeleton-line" /><small>Loading live data</small></article>)}
        </section>
        <div className="forecast-workspace loading-workspace">
          <section className="market-panel loading-market-panel" aria-hidden="true"><span className="skeleton-line label" /><span className="skeleton-line title" /><span className="skeleton-line medium" /><div className="skeleton-chart"><i /><i /><i /><i /><i /></div></section>
          <aside className="trade-ticket loading-trade-ticket" aria-hidden="true"><span className="skeleton-line label" /><span className="skeleton-line title" /><span className="skeleton-line medium" /><div className="loading-odds"><i /><i /></div><span className="skeleton-line field" /><span className="skeleton-line button" /></aside>
        </div>
      </section>
    )
  }

  if (!market) {
    return (
      <section className="room-shell unavailable" aria-live="polite">
        <p className="eyebrow">DreamDEX live market</p>
        <h2>{error ? "No live room found" : "Opening the next room…"}</h2>
        <p>{error || "Reading active DreamDEX Event Contracts from Somnia."}</p>
        {error && <button className="secondary-button" onClick={refresh}>Try again</button>}
      </section>
    )
  }

  const selectedPrice = direction === "UP" ? market.upPrice : market.downPrice
  const maxLoss = selectedPrice === null ? null : Number(shares || 0) * selectedPrice
  return (
    <section className="room-shell" aria-label="Live Proofside room">
      <div className="market-status-bar" aria-live="polite">
        <div className="status-source"><span className={`live-dot ${displayedFreshness.toLowerCase()}`} /><span><small>Live market</small><strong>{freshnessLabel}</strong></span></div>
        <div><small>Somnia network</small><strong>50312</strong></div>
        <div><small>Last market update</small><strong>{lastVerifiedAt ? new Date(lastVerifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Waiting"}</strong></div>
        <div><small>Wallet</small><strong>{tradeState === "CONFIRMED" ? speedLabel(verificationMs) : wallet ? "Ready" : "Not connected"}</strong></div>
      </div>

      {previousMarketId && (
        <div className="rollover-note">✦ Host opened a new room after market <span>{short(previousMarketId)}</span> left the live venue.</div>
      )}

      <section className="market-overview" aria-label="Live market overview">
        <article className="overview-feature">
          <div><p className="source-label dreamdex">Current event contract</p><strong>{market.asset} / USDC</strong></div>
          <span>{market.question}</span>
          <small>Closes in {countdownLabel(market.locksAt, now)} · {durationLabel(market.durationSec)} room</small>
        </article>
        <article className="overview-stat up">
          <p>DreamDEX YES</p>
          <strong>{market.upPrice === null ? "—" : `${Math.round(market.upPrice * 100)}¢`}</strong>
          <small>Live executable price</small>
        </article>
        <article className="overview-stat down">
          <p>DreamDEX NO</p>
          <strong>{market.downPrice === null ? "—" : `${Math.round(market.downPrice * 100)}¢`}</strong>
          <small>Live executable price</small>
        </article>
        <article className="overview-stat room-reading">
          <p>Room reading</p>
          <strong>{room.upPercent}% UP</strong>
          <small>{room.participants} recorded conviction{room.participants === 1 ? "" : "s"}</small>
        </article>
      </section>

      <div className="forecast-workspace">
        <section className="market-panel" aria-labelledby="canonical-market-question">
          <div className="source-heading">
            <span className="source-label dreamdex">DreamDEX canonical rule</span>
            <span>{market.asset} · {durationLabel(market.durationSec)} · closes in {countdownLabel(market.locksAt, now)}</span>
          </div>
          <h2 id="canonical-market-question">{market.question}</h2>
          <div className="line-row">
            <span>Opening reference</span>
            <strong>{market.strike}</strong>
          </div>

          <div className="source-divider"><span className="source-label somnia">Somnia oracle data</span><small>{market.asset}/USDC live reference</small></div>
          <MarketOracleChart market={market} />

        </section>
        <TradeTicket
          wallet={wallet}
          direction={direction}
          upPrice={market.upPrice}
          downPrice={market.downPrice}
          shares={shares}
          maxLoss={maxLoss}
          portfolio={portfolio}
          executionEstimate={executionEstimate}
          marketLive={market.isLive}
          executionBlocked={["STALE", "OFFLINE"].includes(freshness)}
          tradePending={["PREFLIGHT", "AWAITING_SIGNATURE", "SUBMITTED"].includes(tradeState)}
          tradeMessage={tradeMessage}
          tradeState={tradeState}
          tradeProof={tradeProof}
          activities={activities}
          marketId={market.id}
          contractAddress={market.contractAddress}
          attribution={attribution}
          onDirectionChange={(next) => { setDirection(next); setAttribution(null) }}
          onSharesChange={setShares}
          onAddConviction={submitConviction}
          onTrade={trade}
        />
      </div>

      <details className="advanced-tools">
      <summary><span><strong>Agent insights & Decision Lab</strong><small>Optional analysis and verifiable reasoning tools</small></span></summary>
      <div className="market-tools">
      <section className="reference-agent" aria-live="polite">
        <div className="reference-agent-heading"><span className="agent-monogram" aria-hidden="true">PS</span><div><p className="source-label proofside">Rule-based reference agent</p><h3>Proofside Sentinel</h3></div></div>
        <div className="reference-agent-content">{referenceAgent ? <>
          <strong className={referenceAgent.direction.toLowerCase()}>{referenceAgent.direction} · {Math.round(referenceAgent.confidenceBps / 100)}%</strong>
          <p>{referenceAgent.thesis}</p>
          <small>{referenceAgent.proofState} · Updated {new Date(referenceAgent.evidence.observedAt).toLocaleTimeString()}</small>
          <a className="receipt-link" href={`/forecasts/${referenceAgent.receiptId}`}>Verify agent receipt →</a>
        </> : <p>Run the transparent baseline agent against the live DreamDEX price and Somnia oracle.</p>}</div>
        <button className="secondary-button" disabled={referenceBusy || !market.isLive} onClick={refreshReferenceAgent}>{referenceBusy ? "Reading live market…" : "Refresh agent forecast"}</button>
      </section>

      <ForecastComposer
        key={market.id}
        open={decisionLabOpen}
        onOpenChange={setDecisionLabOpen}
        market={market}
        direction={direction}
        onDirectionChange={(next) => { setDirection(next); setAttribution(null) }}
        signals={[...signals.map((signal) => ({ direction: signal.direction, confidence: signal.confidence, reason: signal.reason, agentName: signal.agent.name })), ...(referenceAgent ? [{ direction: referenceAgent.direction, confidence: referenceAgent.confidenceBps / 100, reason: referenceAgent.thesis, agentName: "Proofside Sentinel" }] : [])]}
        room={room}
        baselineUpPrice={decisionBaseline?.marketId === market.id ? decisionBaseline.upPrice : market.upPrice}
        onRevealChange={(_revealed, baselineUpPrice) => setDecisionBaseline({ marketId: market.id, upPrice: baselineUpPrice })}
        onReceipt={setCreatedReceipt}
      />
      </div>
      </details>

      {createdReceipt && <section className="created-receipt" aria-live="polite">
        <div className="section-title compact-title"><p className="eyebrow">Decision memory</p><h2>Your reasoning is now verifiable.</h2></div>
        <ReceiptCard receipt={createdReceipt} />
      </section>}
    </section>
  )
}
