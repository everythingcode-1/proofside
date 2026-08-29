"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { EIP1193Provider } from "viem"
import { DREAMDEX } from "@/lib/config"
import { placeBrowserOrder, watchMarketBook } from "@/lib/dreamdex"
import { countdownLabel, durationLabel, probabilityLabel } from "@/lib/format"
import { openingSummary, resultSummary } from "@/lib/lifecycle"
import { freshnessState, type FreshnessState } from "@/lib/realtime"
import type { TransactionState } from "@/lib/transactions"
import type { Direction, MarketView, RoomState, TradeProof } from "@/lib/types"

type MarketResponse = { market?: MarketView; error?: string; fetchedAt: number }

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
  const [market, setMarket] = useState<MarketView | null>(null)
  const [room, setRoom] = useState<RoomState>(emptyRoom())
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<Direction>("UP")
  const [shares, setShares] = useState("1")
  const [wallet, setWallet] = useState<`0x${string}` | null>(null)
  const [tradeProof, setTradeProof] = useState<TradeProof | null>(null)
  const [tradeState, setTradeState] = useState<TransactionState>("IDLE")
  const [tradeMessage, setTradeMessage] = useState("Connect a wallet to join the room.")
  const [now, setNow] = useState(Date.now())
  const [streamState, setStreamState] = useState<FreshnessState>("OFFLINE")
  const [lastVerifiedAt, setLastVerifiedAt] = useState<number | null>(null)
  const [previousMarketId, setPreviousMarketId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/market", { cache: "no-store" })
      const payload = (await response.json()) as MarketResponse
      if (!response.ok || !payload.market) {
        setError(payload.error || "DreamDEX market is unavailable.")
        return
      }
      setError(null)
      setMarket((current) => {
        if (current && current.id !== payload.market!.id) setPreviousMarketId(current.id)
        return payload.market!
      })
      setLastVerifiedAt(payload.fetchedAt)
      const roomResponse = await fetch(`/api/rooms/${payload.market.id}`, { cache: "no-store" })
      if (roomResponse.ok) setRoom((await roomResponse.json()) as RoomState)
    } catch {
      setStreamState("RECONNECTING")
      setError("DreamPulse is reconnecting to its server and DreamDEX.")
    }
  }, [])

  useEffect(() => {
    refresh()
    const marketTimer = window.setInterval(refresh, 15_000)
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => {
      window.clearInterval(marketTimer)
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
        void refresh()
      },
      setStreamState,
    )
    return () => { void stop?.() }
  }, [market?.id, refresh])

  const freshness = freshnessState({
    connected: streamState === "LIVE",
    retrying: streamState === "RECONNECTING",
    hasSnapshot: Boolean(market),
    lastVerifiedAt,
    now,
  })

  const provider = () => (window as Window & { ethereum?: EIP1193Provider }).ethereum

  const connect = async () => {
    const injected = provider()
    if (!injected) {
      setTradeState("BLOCKED")
      setTradeMessage("No injected EVM wallet was found.")
      return null
    }
    setTradeState("PREFLIGHT")
    try {
      await injected.request({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${DREAMDEX.chainId.toString(16)}` }] }).catch(async () => {
        await injected.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: `0x${DREAMDEX.chainId.toString(16)}`,
            chainName: "Somnia Shannon Testnet",
            nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
            rpcUrls: [DREAMDEX.rpcUrl],
            blockExplorerUrls: [DREAMDEX.explorerUrl],
          }],
        })
      })
      const accounts = (await injected.request({ method: "eth_requestAccounts" })) as `0x${string}`[]
      const account = accounts[0]
      if (!account) throw new Error("No wallet account was selected.")
      setWallet(account)
      setTradeState("IDLE")
      setTradeMessage("Wallet connected. Choose your conviction or place a verified trade.")
      return account
    } catch (reason) {
      setTradeState("CANCELLED")
      setTradeMessage(reason instanceof Error ? reason.message : "Wallet connection was cancelled.")
      return null
    }
  }

  const submitConviction = async () => {
    if (!market?.isLive) return
    const account = wallet || (await connect())
    if (!account) return
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

  const trade = async () => {
    if (!market?.isLive) return
    if (["STALE", "OFFLINE"].includes(freshness)) {
      setTradeState("BLOCKED")
      setTradeMessage("Market data is stale. Wait for DreamPulse to reconnect before trading.")
      return
    }
    const injected = provider()
    const account = wallet || (await connect())
    if (!injected || !account) return
    const amount = Number(shares)
    if (!Number.isFinite(amount) || amount <= 0) {
      setTradeState("BLOCKED")
      setTradeMessage("Enter a share amount greater than zero.")
      return
    }
    setTradeState("PREFLIGHT")
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
      setTradeMessage("DreamDEX transaction confirmed on Somnia. Fill status is separate from confirmation.")
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

  const crowdUp = `${room.upPercent}%`
  const hostText = useMemo(() => {
    if (!market) return "Scanning the DreamDEX venue for the next live room…"
    if (market.phase === "SETTLED" && market.outcome) {
      const crowdWon = market.outcome === "UP" ? room.upPercent : room.downPercent
      return resultSummary({ asset: market.asset, outcome: market.outcome, crowdWon })
    }
    if (market.phase === "VOID") return "DreamDEX voided this contract. No winning direction is declared."
    return openingSummary({
      asset: market.asset,
      strike: market.strike,
      up: probabilityLabel(market.upPrice),
      crowd: crowdUp,
    })
  }, [market, room, crowdUp])

  if (!market) {
    return (
      <section className="room-shell unavailable" aria-live="polite">
        <div className="agent-orb"><span /></div>
        <p className="eyebrow">Host agent · scanning</p>
        <h2>{error ? "No live room found" : "Opening the next room…"}</h2>
        <p>{error || "Reading active DreamDEX Event Contracts from Somnia."}</p>
        {error && <button className="secondary-button" onClick={refresh}>Try again</button>}
      </section>
    )
  }

  const selectedPrice = direction === "UP" ? market.upPrice : market.downPrice
  const maxLoss = selectedPrice === null ? null : Number(shares || 0) * selectedPrice

  return (
    <section className="room-shell" aria-label="Live DreamPulse room">
      <div className="agent-strip">
        <div className="agent-identity">
          <div className="agent-orb"><span /></div>
          <div><p>DreamPulse host</p><small>Autonomous lifecycle agent</small></div>
        </div>
        <div className={`agent-status ${freshness.toLowerCase()}`}>
          <span /> {freshness} · {lastVerifiedAt ? `VERIFIED ${new Date(lastVerifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "WAITING"}
        </div>
      </div>

      {previousMarketId && (
        <div className="rollover-note">✦ Host opened a new room after market <span>{short(previousMarketId)}</span> left the live venue.</div>
      )}

      <div className="room-grid">
        <div className="market-panel">
          <div className="market-meta">
            <span>{market.asset} · {durationLabel(market.durationSec)}</span>
            <span>Closes in {countdownLabel(market.locksAt, now)}</span>
          </div>
          <h2>{market.question}</h2>
          <div className="line-row">
            <span>Line to beat</span>
            <strong>{market.strike}</strong>
          </div>

          <div className="odds-grid">
            <button className={`odds-card up ${direction === "UP" ? "selected" : ""}`} onClick={() => setDirection("UP")} disabled={!market.isLive}>
              <span>▲ UP</span><strong>{probabilityLabel(market.upPrice)}</strong><small>backs YES</small>
            </button>
            <button className={`odds-card down ${direction === "DOWN" ? "selected" : ""}`} onClick={() => setDirection("DOWN")} disabled={!market.isLive}>
              <span>▼ DOWN</span><strong>{probabilityLabel(market.downPrice)}</strong><small>backs NO</small>
            </button>
          </div>

          <div className="host-note">
            <span className="spark">✦</span>
            <div><small>HOST SUMMARY · FACTUAL</small><p>{hostText}</p></div>
          </div>

          <div className="crowd-card">
            <div className="section-heading"><span>Room conviction</span><small>{room.participants} participants</small></div>
            <div className="conviction-bar"><span style={{ width: `${room.upPercent}%` }} /></div>
            <div className="conviction-labels"><strong>▲ {room.upPercent}% UP</strong><strong>▼ {room.downPercent}% DOWN</strong></div>
            <p>Social votes are unweighted and are not verified trades.</p>
          </div>
        </div>

        <aside className="action-panel">
          <div className="section-heading"><span>Your position</span><small>{wallet ? short(wallet) : "wallet not connected"}</small></div>
          <div className="direction-review"><span>Conviction</span><strong className={direction.toLowerCase()}>{direction === "UP" ? "▲" : "▼"} {direction}</strong></div>

          <label htmlFor="shares">Shares</label>
          <div className="amount-input"><input id="shares" inputMode="decimal" value={shares} onChange={(event) => setShares(event.target.value)} /><span>contracts</span></div>

          <div className="risk-box">
            <div><span>Live price</span><strong>{probabilityLabel(selectedPrice)}</strong></div>
            <div><span>Maximum loss</span><strong>{maxLoss === null ? "—" : `${maxLoss.toFixed(2)} tUSDC`}</strong></div>
            <div><span>Execution</span><strong>DreamDEX IOC</strong></div>
          </div>

          {!wallet && <button className="primary-button" onClick={connect} disabled={tradeState === "PREFLIGHT"}>Connect wallet</button>}
          {wallet && <button className="secondary-button" onClick={submitConviction} disabled={!market.isLive}>Add conviction only</button>}
          <button className="trade-button" onClick={trade} disabled={!market.isLive || ["PREFLIGHT", "AWAITING_SIGNATURE", "SUBMITTED"].includes(tradeState) || ["STALE", "OFFLINE"].includes(freshness)}>
            {["PREFLIGHT", "AWAITING_SIGNATURE", "SUBMITTED"].includes(tradeState) ? "Transaction in progress…" : `Trade ${direction} on DreamDEX`}
          </button>
          <p className={`trade-message ${tradeState.toLowerCase()}`} aria-live="polite">{tradeMessage}</p>

          <div className="proof-panel">
            <div className="section-heading"><span>Onchain proof</span><small>authoritative</small></div>
            <dl>
              <div><dt>Network</dt><dd>Somnia · 50312</dd></div>
              <div><dt>Market ID</dt><dd title={market.id}>{short(market.id)}</dd></div>
              <div><dt>Pool</dt><dd title={market.contractAddress}>{short(market.contractAddress)}</dd></div>
              <div><dt>Transaction</dt><dd>{tradeProof ? <a href={tradeProof.explorerUrl} target="_blank" rel="noreferrer">{short(tradeProof.hash)} ↗</a> : "Not submitted"}</dd></div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  )
}
