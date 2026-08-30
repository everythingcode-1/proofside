"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { chartGeometry } from "@/lib/chart-geometry"
import type { OracleChartView } from "@/lib/oracle-chart"

const price = (value: number | null) => value === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value)

export function MarketOracleChart({ marketId, asset }: { marketId: string; asset: "BTC" | "ETH" }) {
  const [chart, setChart] = useState<OracleChartView | null>(null), [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/markets/${encodeURIComponent(marketId)}/chart`, { cache: "no-store" })
      const body = await response.json(); if (!response.ok) throw new Error(body.message || "Oracle chart unavailable.")
      setChart(body.chart); setError(null)
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Oracle chart unavailable.") }
  }, [marketId])
  useEffect(() => { setChart(null); setError(null); void refresh(); const timer = window.setInterval(refresh, 15_000); return () => window.clearInterval(timer) }, [refresh])
  const geometry = useMemo(() => chartGeometry(chart?.points ?? [], 800, 260, 18), [chart])
  if (!chart) return <section className="oracle-chart loading" aria-live="polite"><div><span>{asset} / USDC</span><strong>{error || "Reading Somnia oracle…"}</strong></div>{error && <button onClick={refresh}>Retry</button>}</section>
  const above = chart.change !== null && chart.change >= 0
  const openingY = chart.openingPrice === null ? null : Math.max(18, Math.min(242, geometry.yFor(chart.openingPrice)))
  const summary = chart.currentPrice === null ? `${asset} oracle has no candle data.` : `${asset} is ${price(Math.abs(chart.change ?? 0))} ${above ? "above" : "below"} its opening reference.`
  return <section className={`oracle-chart ${chart.freshness.toLowerCase()}`} aria-label={summary}>
    <div className="oracle-chart-head"><div><span>{asset} / {chart.quote}</span><strong>{price(chart.currentPrice)}</strong></div><div className={above ? "positive" : "negative"}><span>{above ? "Above opening" : "Below opening"}</span><strong>{chart.change === null ? "—" : `${above ? "+" : "−"}${price(Math.abs(chart.change))} · ${above ? "+" : "−"}${Math.abs(chart.changePercent ?? 0).toFixed(2)}%`}</strong></div></div>
    <div className="oracle-plot">
      {geometry.line ? <svg viewBox="0 0 800 260" role="img" aria-label={summary} preserveAspectRatio="none"><defs><linearGradient id={`oracle-fill-${asset}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={above ? "var(--cyan)" : "var(--coral)"} stopOpacity=".25"/><stop offset="1" stopColor={above ? "var(--cyan)" : "var(--coral)"} stopOpacity="0"/></linearGradient></defs>{openingY !== null && <><rect x="0" y="0" width="800" height={openingY} className="up-zone"/><rect x="0" y={openingY} width="800" height={260-openingY} className="down-zone"/><line x1="0" x2="800" y1={openingY} y2={openingY} className="opening-line"/></>}<path d={geometry.area} fill={`url(#oracle-fill-${asset})`}/><path d={geometry.line} className={above ? "price-line up" : "price-line down"}/></svg> : <div className="oracle-empty">Waiting for at least two M1 oracle candles.</div>}
      {openingY !== null && <span className="opening-label" style={{ top: `${openingY / 260 * 100}%` }}>Opening {price(chart.openingPrice)}</span>}
    </div>
    <div className="oracle-chart-foot"><span>{chart.points[0] ? new Date(chart.points[0].time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "No history"}</span><span className={chart.freshness.toLowerCase()}>Somnia oracle · {chart.freshness}</span><span>{chart.updatedAt ? new Date(chart.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Waiting"}</span></div>
  </section>
}
