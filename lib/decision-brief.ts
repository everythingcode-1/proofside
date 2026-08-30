import type { Direction } from "./types"

export type DecisionSignal = {
  direction: Direction
  confidence: number | null
  reason: string
  agentName: string
}

export type DecisionBrief = {
  changes: string[]
  marketRead: string
  marketChallenge: string | null
  support: string[]
  counter: string[]
  consensus: "ALIGNED" | "SPLIT" | "OPPOSED" | "NO_SIGNAL"
}

const cents = (value: number) => `${Math.round(value * 100)}¢`

export function buildDecisionBrief(input: {
  market: { asset: string; upPrice: number | null; downPrice: number | null }
  previousUpPrice: number | null
  judgment: Direction
  signals: DecisionSignal[]
}): DecisionBrief {
  const { market, previousUpPrice, judgment, signals } = input
  const changes: string[] = []

  if (market.upPrice !== null && previousUpPrice !== null) {
    const delta = Math.round((market.upPrice - previousUpPrice) * 100)
    if (delta !== 0) {
      const direction = delta > 0 ? "UP" : "DOWN"
      changes.push(`DreamDEX moved ${Math.abs(delta)}¢ toward ${direction} since your room snapshot.`)
    }
  }
  if (changes.length === 0) changes.push("No material DreamDEX odds move has been verified yet.")

  const selectedPrice = judgment === "UP" ? market.upPrice : market.downPrice
  const support = signals.filter((signal) => signal.direction === judgment && signal.reason.trim()).map((signal) => `${signal.agentName}: ${signal.reason.trim()}`)
  const counter = signals.filter((signal) => signal.direction !== judgment && signal.reason.trim()).map((signal) => `${signal.agentName}: ${signal.reason.trim()}`)
  const aligned = signals.filter((signal) => signal.direction === judgment).length
  const opposed = signals.length - aligned

  return {
    changes,
    marketRead: selectedPrice === null
      ? `DreamDEX has no executable ${judgment} quote in this snapshot.`
      : `DreamDEX prices ${judgment} at ${cents(selectedPrice)} right now.`,
    marketChallenge: selectedPrice !== null && selectedPrice < 0.35
      ? `DreamDEX prices your ${judgment} side at only ${cents(selectedPrice)}; this opposes your judgment.`
      : null,
    support,
    counter,
    consensus: signals.length === 0 ? "NO_SIGNAL" : aligned === 0 ? "OPPOSED" : opposed === 0 ? "ALIGNED" : "SPLIT",
  }
}
