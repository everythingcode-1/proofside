import type { Direction } from "./types"

type ReferenceInput = {
  asset: "BTC" | "ETH"
  strike: string
  oraclePrice: number
  upPrice: number
  observedAt: number
}

export type ReferenceForecast = {
  direction: Direction
  confidenceBps: number
  thesis: string
  counterCase: string
  invalidationCondition: string
  evidence: { oraclePrice: number; strike: number; upPrice: number; observedAt: number }
}

export function buildReferenceForecast(input: ReferenceInput): ReferenceForecast {
  const strike = Number(input.strike.replace(/[^0-9.-]/g, ""))
  if (!Number.isFinite(strike) || strike <= 0 || !Number.isFinite(input.oraclePrice) || !Number.isFinite(input.upPrice)) {
    throw new Error("REFERENCE_INPUT_INVALID")
  }
  const direction: Direction = input.upPrice >= 0.5 ? "UP" : "DOWN"
  const probability = direction === "UP" ? input.upPrice : 1 - input.upPrice
  const confidenceBps = Math.round(Math.max(0.55, Math.min(0.85, probability)) * 10_000)
  const relation = input.oraclePrice >= strike ? "above" : "below"
  const opposite = direction === "UP" ? "DOWN" : "UP"
  const formattedStrike = strike.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return {
    direction,
    confidenceBps,
    thesis: `${input.asset} trades ${relation} the ${formattedStrike} strike while DreamDEX prices ${direction} at ${Math.round(probability * 100)}%.`,
    counterCase: `The live oracle can cross the strike before lock and move the contract toward ${opposite}.`,
    invalidationCondition: `${input.asset} crosses to the opposite side of the ${formattedStrike} strike before market lock.`,
    evidence: { oraclePrice: input.oraclePrice, strike, upPrice: input.upPrice, observedAt: input.observedAt },
  }
}
