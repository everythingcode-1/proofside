import type { MarketPhase } from "./types"

const PHASES: MarketPhase[] = ["OPENING", "LIVE", "LOCKED", "SETTLING", "SETTLED", "VOID"]

export function phaseFromStatus(status: number): MarketPhase {
  const phase = PHASES[status]
  if (!phase) throw new Error(`Unknown DreamDEX market status: ${status}`)
  return phase
}

export function openingSummary(input: { asset: string; strike: string; up: string; crowd: string }) {
  return `${input.asset} must finish above ${input.strike} when this window closes. DreamDEX prices UP at ${input.up}; this room currently leans ${input.crowd} UP.`
}

export function resultSummary(input: { asset: string; outcome: "UP" | "DOWN"; crowdWon: number }) {
  return `${input.asset} settled ${input.outcome}. ${input.crowdWon}% of room participants backed the winning direction.`
}
