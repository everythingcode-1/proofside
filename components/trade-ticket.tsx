"use client"

import { DREAMDEX } from "../lib/config"
import type { PortfolioView } from "../lib/dreamdex"
import { probabilityLabel } from "../lib/format"
import type { TransactionState } from "../lib/transactions"
import type { Direction, TradeProof } from "../lib/types"

type Activity = { kind: "FAUCET" | "ORDER"; hash: `0x${string}`; detail: string }

type TradeTicketProps = {
  wallet: `0x${string}` | null
  direction: Direction
  upPrice: number | null
  downPrice: number | null
  shares: string
  maxLoss: number | null
  portfolio: PortfolioView | null
  marketLive: boolean
  executionBlocked: boolean
  tradePending: boolean
  tradeMessage: string
  tradeState: TransactionState
  tradeProof: TradeProof | null
  activities: Activity[]
  marketId: string
  contractAddress: string
  attribution: { agent: string; signal: string; name?: string } | null
  onDirectionChange: (direction: Direction) => void
  onSharesChange: (shares: string) => void
  onAddConviction: () => void
  onTrade: () => void
}

const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`

export function TradeTicket({
  wallet,
  direction,
  upPrice,
  downPrice,
  shares,
  maxLoss,
  portfolio,
  marketLive,
  executionBlocked,
  tradePending,
  tradeMessage,
  tradeState,
  tradeProof,
  activities,
  marketId,
  contractAddress,
  attribution,
  onDirectionChange,
  onSharesChange,
  onAddConviction,
  onTrade,
}: TradeTicketProps) {
  const selectedPrice = direction === "UP" ? upPrice : downPrice
  const tradeLabel = wallet ? `Trade ${direction} on DreamDEX` : "Connect wallet to trade"

  return (
    <aside className="trade-ticket action-panel" aria-label="DreamDEX order ticket">
      <div className="source-heading">
        <span className="source-label dreamdex">DreamDEX execution</span>
        <span>{wallet ? short(wallet) : "Wallet optional to explore"}</span>
      </div>
      <h3>Choose a side.</h3>
      <p className="ticket-copy">Set your exposure and review the maximum loss before signing.</p>

      <div className="odds-grid" aria-label="DreamDEX outcome prices">
        <button className={`odds-card up ${direction === "UP" ? "selected" : ""}`} onClick={() => onDirectionChange("UP")} disabled={!marketLive}>
          <span>▲ UP</span><strong>{probabilityLabel(upPrice)}</strong><small>backs YES</small>
        </button>
        <button className={`odds-card down ${direction === "DOWN" ? "selected" : ""}`} onClick={() => onDirectionChange("DOWN")} disabled={!marketLive}>
          <span>▼ DOWN</span><strong>{probabilityLabel(downPrice)}</strong><small>backs NO</small>
        </button>
      </div>

      {attribution && <p className="signal-attribution">Signal from {attribution.name || short(attribution.agent)}; you control the final direction.</p>}

      <label htmlFor="shares">Contracts</label>
      <div className="amount-input">
        <input id="shares" inputMode="decimal" value={shares} onChange={(event) => onSharesChange(event.target.value)} />
        <span>contracts</span>
      </div>

      <div className="risk-box">
        <div><span>Selected side</span><strong className={direction.toLowerCase()}>{direction === "UP" ? "▲" : "▼"} {direction}</strong></div>
        <div><span>Live price</span><strong>{probabilityLabel(selectedPrice)}</strong></div>
        <div><span>Maximum loss</span><strong>{maxLoss === null ? "—" : `${maxLoss.toFixed(2)} tUSDC`}</strong></div>
        <div><span>Execution</span><strong>DreamDEX IOC</strong></div>
      </div>

      <details className="portfolio-disclosure">
        <summary>Wallet & portfolio</summary>
        <div><span>Collateral</span><strong>{portfolio ? `${portfolio.collateral.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${portfolio.collateralCode}` : wallet ? "Loading…" : "Connect to view"}</strong></div>
        <div><span>UP / DOWN held</span><strong>{portfolio ? `${portfolio.upShares} / ${portfolio.downShares}` : "—"}</strong></div>
      </details>

      {wallet && <button className="secondary-button" onClick={onAddConviction} disabled={!marketLive}>Add conviction only</button>}
      <button
        className="trade-button"
        aria-label={wallet ? `Trade ${direction} on DreamDEX` : "Connect wallet to trade"}
        onClick={onTrade}
        disabled={!wallet || !marketLive || executionBlocked || tradePending}
      >
        {tradePending ? "Transaction in progress…" : tradeLabel}
      </button>
      {!wallet && <p className="navbar-wallet-hint">Connect and claim test collateral from the navbar when you are ready to sign.</p>}
      <p className={`trade-message ${tradeState.toLowerCase()}`} aria-live="polite">{tradeMessage}</p>

      {tradeProof && <div className="proof-panel">
        <div className="section-heading"><span>Onchain proof</span><small>authoritative</small></div>
        <dl>
          <div><dt>Network</dt><dd>Somnia · 50312</dd></div>
          <div><dt>Market ID</dt><dd title={marketId}>{short(marketId)}</dd></div>
          <div><dt>Pool</dt><dd title={contractAddress}>{short(contractAddress)}</dd></div>
          <div><dt>Transaction</dt><dd><a href={tradeProof.explorerUrl} target="_blank" rel="noreferrer">{short(tradeProof.hash)} ↗</a></dd></div>
        </dl>
        {activities.length > 0 && <dl>
          {activities.slice(0, 4).map((activity) => <div key={`${activity.kind}-${activity.hash}`}>
            <dt>{activity.kind}</dt>
            <dd><a href={`${DREAMDEX.explorerUrl}/tx/${activity.hash}`} target="_blank" rel="noreferrer" title={activity.detail}>{activity.detail} ↗</a></dd>
          </div>)}
        </dl>}
      </div>}
    </aside>
  )
}
