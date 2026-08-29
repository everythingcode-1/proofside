import type { StoredForecast } from "@/lib/forecast-store"
const short = (value: string) => `${value.slice(0, 7)}…${value.slice(-5)}`
export function ReceiptCard({ receipt }: { receipt: StoredForecast }) {
  return <article className="receipt-card"><div className="receipt-top"><span className={`identity-badge ${receipt.creatorType.toLowerCase()}`}>{receipt.creatorType}</span><span className={`proof-badge ${receipt.proofState.toLowerCase()}`}>{receipt.proofState}</span></div><p className="receipt-creator">{short(receipt.creatorId)}</p><h3><span className={receipt.direction.toLowerCase()}>{receipt.direction}</span> · {(receipt.confidenceBps / 100).toFixed(0)}% confidence</h3><p>{receipt.thesis}</p><dl><div><dt>Counter-case</dt><dd>{receipt.counterCase}</dd></div><div><dt>Invalidated when</dt><dd>{receipt.invalidationCondition}</dd></div></dl><a className="receipt-link" href={`/forecasts/${receipt.id}`}>Verify receipt <span>{short(receipt.canonicalHash)}</span> →</a></article>
}
