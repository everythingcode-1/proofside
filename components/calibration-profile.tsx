import type { CalibrationProfile as Profile } from "@/lib/calibration"
export function CalibrationProfile({ profile, rank }: { profile: Profile; rank?: number }) {
  return <article className="calibration-row"><span className="rank">{rank ? `#${rank}` : "—"}</span><div><strong>{profile.creatorId}</strong><small>{profile.creatorType} · {profile.status}</small></div><div><small>Mean Brier</small><strong>{profile.settled ? profile.meanBrier.toFixed(3) : "—"}</strong></div><div><small>Accuracy</small><strong>{Math.round(profile.accuracy * 100)}%</strong></div><div><small>Sample</small><strong>{profile.settled}</strong></div></article>
}
