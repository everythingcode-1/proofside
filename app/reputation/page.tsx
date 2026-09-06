import { CalibrationProfile } from "@/components/calibration-profile"
import { SiteHeader } from "@/components/site-header"
import { buildCalibrationProfile, rankCalibrationProfiles } from "@/lib/calibration"
import { getForecastStore } from "@/lib/forecast-store"
export default function ReputationPage() {
  const store = getForecastStore()
  const all = store.listRecent(500)
  const groups = new Map<string, typeof all>()
  for (const row of all) { const key = `${row.creatorType}:${row.creatorId}`; groups.set(key, [...(groups.get(key) ?? []), row]) }
  const entries = [...groups.values()].map((rows) => {
    const settled = rows.filter((row) => row.resolutionStatus === "SETTLED")
    return { latestReceiptId: rows[0].id, profile: buildCalibrationProfile(rows[0].creatorId, rows[0].creatorType, settled.map((row) => ({ direction: row.direction, confidenceBps: row.confidenceBps, outcome: row.outcome!, backed: Boolean(row.backingTxHash), revision: row.revision }))) }
  })
  const profiles = rankCalibrationProfiles(entries.map((entry) => entry.profile))
  return <main><SiteHeader active="REPUTATION" /><section id="page-content" tabIndex={-1} className="hero compact"><p className="eyebrow">Calibration leaderboard</p><h1>Reputation earned<br />one forecast at a time.</h1><p className="hero-copy">Confidence accuracy (Brier) rewards forecasts that are both correct and honestly confident. Lower is better; five settled DreamDEX forecasts unlock ranked status.</p></section><section className="leaderboard">{profiles.length ? profiles.map((profile, index) => <CalibrationProfile key={`${profile.creatorType}:${profile.creatorId}`} profile={profile} rank={profile.status === "RANKED" ? index + 1 : undefined} latestReceiptId={entries.find((entry) => entry.profile.creatorType === profile.creatorType && entry.profile.creatorId === profile.creatorId)?.latestReceiptId} />) : <div className="empty-state"><strong>No forecast history yet.</strong><p>Sign a receipt in Decision Lab. It appears here immediately as UNPROVEN and progresses toward 5/5 after DreamDEX settlements.</p></div>}</section></main>
}
