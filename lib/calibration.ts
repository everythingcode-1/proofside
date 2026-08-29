import type { CreatorType } from "./forecast-receipt"
import type { Direction } from "./types"

export type SettledForecast = { direction: Direction; confidenceBps: number; outcome: Direction; backed: boolean; revision: number }
export type CalibrationProfile = {
  creatorId: string
  creatorType: CreatorType
  status: "UNPROVEN" | "RANKED"
  settled: number
  accuracy: number
  meanBrier: number
  calibrationError: number
  backedRate: number
  revisionRate: number
}

export function scoreForecast(direction: Direction, confidenceBps: number, outcome: Direction) {
  const probability = confidenceBps / 10_000
  return Number(((probability - (direction === outcome ? 1 : 0)) ** 2).toFixed(12))
}

export function buildCalibrationProfile(creatorId: string, creatorType: CreatorType, forecasts: SettledForecast[]): CalibrationProfile {
  const settled = forecasts.length
  const correct = forecasts.filter((row) => row.direction === row.outcome).length
  const brier = forecasts.reduce((sum, row) => sum + scoreForecast(row.direction, row.confidenceBps, row.outcome), 0)
  const buckets = new Map<number, { confidence: number; correct: number; count: number }>()
  for (const row of forecasts) {
    const bucket = Math.floor(row.confidenceBps / 1000) * 10
    const value = buckets.get(bucket) ?? { confidence: 0, correct: 0, count: 0 }
    value.confidence += row.confidenceBps / 10_000
    value.correct += Number(row.direction === row.outcome)
    value.count++
    buckets.set(bucket, value)
  }
  const calibrationError = settled ? [...buckets.values()].reduce((sum, bucket) => {
    return sum + (bucket.count / settled) * Math.abs(bucket.confidence / bucket.count - bucket.correct / bucket.count)
  }, 0) : 0
  return {
    creatorId, creatorType, status: settled >= 5 ? "RANKED" : "UNPROVEN", settled,
    accuracy: settled ? correct / settled : 0,
    meanBrier: settled ? brier / settled : 0,
    calibrationError,
    backedRate: settled ? forecasts.filter((row) => row.backed).length / settled : 0,
    revisionRate: settled ? forecasts.filter((row) => row.revision > 1).length / settled : 0,
  }
}

export function rankCalibrationProfiles(profiles: CalibrationProfile[]) {
  return [...profiles].sort((a, b) => a.meanBrier - b.meanBrier || b.settled - a.settled || a.calibrationError - b.calibrationError)
}
