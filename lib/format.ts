import { formatUnits } from "viem"

export function formatUnitsSafe(value: bigint, decimals: number, fractionDigits = 2) {
  return Number(formatUnits(value, decimals)).toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function formatProbability(value: bigint, decimals: number) {
  return `${Math.round(Number(formatUnits(value, decimals)) * 100)}%`
}

export function probabilityLabel(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}¢`
}

export function durationLabel(seconds: number) {
  if (seconds % 3600 === 0) return `${seconds / 3600}h`
  if (seconds % 60 === 0) return `${seconds / 60}m`
  return `${seconds}s`
}

export function countdownLabel(targetSeconds: number, nowMs = Date.now()) {
  const left = Math.max(0, targetSeconds - Math.floor(nowMs / 1000))
  const minutes = Math.floor(left / 60)
  const seconds = left % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}
