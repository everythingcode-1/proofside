"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { watchOraclePrice } from "@/lib/dreamdex"
import { applyLiveOracleTick, mergeOracleChartPoints, seedOracleChart, type OracleChartView, type OracleLiveTick } from "@/lib/oracle-chart"
import type { MarketView } from "@/lib/types"

const price = (value: number | null) => value === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value)

export function MarketOracleChart({ market }: { market: Pick<MarketView, "id" | "asset" | "opensAt" | "locksAt" | "strike"> }) {
  const { id: marketId, asset } = market
  const [chart, setChart] = useState<OracleChartView | null>(null), [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<{ state: "CONNECTING" | "LIVE" | "OFFLINE"; block: number | null; sourceAge: number | null }>({ state: "CONNECTING", block: null, sourceAge: null })
  const refreshing = useRef(false)
  const liveTick = useRef<OracleLiveTick | null>(null)
  const refresh = useCallback(async () => {
    if (refreshing.current) return
    refreshing.current = true
    try {
      const response = await fetch(`/api/markets/${encodeURIComponent(marketId)}/chart`, { cache: "no-store" })
      const body = await response.json(); if (!response.ok) throw new Error(body.message || "Oracle chart unavailable.")
      const next = body.chart as OracleChartView
      setChart((current) => {
        const merged = !current || current.marketId !== next.marketId ? next : { ...next, points: mergeOracleChartPoints(current.points, next.points) }
        return liveTick.current ? applyLiveOracleTick(merged, liveTick.current) : merged
      })
      setError(null)
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Oracle chart unavailable.") }
    finally { refreshing.current = false }
  }, [marketId])
  useEffect(() => { setChart(null); setError(null); liveTick.current = null; void refresh(); const timer = window.setInterval(refresh, 30_000); return () => window.clearInterval(timer) }, [refresh])
  useEffect(() => {
    const stop = watchOraclePrice(asset, (tick) => {
      liveTick.current = tick
      setChart((current) => current ? applyLiveOracleTick(current, tick) : seedOracleChart(market, tick))
      const sourceTime = tick.sourceUpdatedAtMs ?? tick.blockTimestamp * 1000
      setStream({ state: "LIVE", block: tick.blockNumber, sourceAge: Math.max(0, tick.receivedAt - sourceTime) })
    }, (state) => setStream((current) => ({ ...current, state })))
    return () => { void stop() }
  }, [asset, marketId, market.opensAt, market.locksAt, market.strike])
  if (!chart) return <section className="oracle-chart loading" aria-live="polite"><div><span>{asset} / USDC</span><strong>{error || "Reading Somnia oracle…"}</strong></div>{error && <button onClick={refresh}>Retry</button>}</section>
  const above = chart.change !== null && chart.change >= 0
  const summary = chart.currentPrice === null ? `${asset} oracle has no candle data.` : `${asset} is ${price(Math.abs(chart.change ?? 0))} ${above ? "above" : "below"} its opening reference.`
  return <section className={`oracle-chart ${chart.freshness.toLowerCase()}`} aria-label={summary}>
    <div className="oracle-chart-head"><div><span>{asset} / {chart.quote}</span><strong>{price(chart.currentPrice)}</strong></div><div className={above ? "positive" : "negative"}><span>{above ? "Above opening" : "Below opening"}</span><strong>{chart.change === null ? "—" : `${above ? "+" : "−"}${price(Math.abs(chart.change))} · ${above ? "+" : "−"}${Math.abs(chart.changePercent ?? 0).toFixed(2)}%`}</strong></div></div>
    <div className="oracle-plot" role="img" aria-label={summary}>
      {chart.points.length > 1 ? <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart.points} margin={{ top: 16, right: 22, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.055)" strokeDasharray="3 5" />
          <XAxis dataKey="time" axisLine={false} tickLine={false} minTickGap={54} tickFormatter={(time) => new Date(time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
          <YAxis domain={["dataMin - 5", "dataMax + 5"]} axisLine={false} tickLine={false} width={66} tickFormatter={(value) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)} />
          <Tooltip cursor={{ stroke: "rgba(255,255,255,.16)", strokeDasharray: "3 4" }} content={({ active, payload, label }) => active && payload?.[0] ? <div className="oracle-tooltip"><span>{new Date(Number(label) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span><strong>{price(Number(payload[0].value))}</strong></div> : null} />
          {chart.openingPrice !== null && <ReferenceLine y={chart.openingPrice} stroke="rgba(255,181,71,.72)" strokeDasharray="6 6" label={{ value: `Opening ${price(chart.openingPrice)}`, position: "insideTopRight", fill: "#ffb547", fontSize: 10 }} />}
          <Line type="monotone" dataKey="close" stroke={above ? "var(--cyan)" : "var(--coral)"} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "var(--ink)" }} isAnimationActive animationDuration={500} animationEasing="ease-out" />
        </LineChart>
      </ResponsiveContainer> : <div className="oracle-empty oracle-live-seed"><i /><span>Live tick received</span><small>Drawing the next oracle update…</small></div>}
    </div>
    <div className="oracle-chart-foot"><span>{chart.points[0] ? new Date(chart.points[0].time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "No history"}</span><span className={stream.state === "LIVE" ? "live" : "stale"}>Oracle WebSocket · {stream.state}{stream.sourceAge !== null ? ` · source age ${stream.sourceAge}ms` : ""}</span><span>{stream.block ? `Block #${stream.block.toLocaleString()}` : chart.updatedAt ? new Date(chart.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Waiting"}</span></div>
  </section>
}
