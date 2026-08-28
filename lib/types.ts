export type Direction = "UP" | "DOWN"
export type MarketPhase = "OPENING" | "LIVE" | "LOCKED" | "SETTLING" | "SETTLED" | "VOID"

export type MarketView = {
  id: string
  symbol: string
  asset: "BTC" | "ETH"
  durationSec: number
  strike: string
  upPrice: number | null
  downPrice: number | null
  opensAt: number
  locksAt: number
  phase: MarketPhase
  outcome: Direction | null
  contractAddress: `0x${string}`
  yesSymbol: string
  noSymbol: string
  statusCode: number
  isLive: boolean
}

export type RoomState = {
  roomId: string
  participants: number
  up: number
  down: number
  upPercent: number
  downPercent: number
}

export type TradeProof = {
  hash: `0x${string}`
  explorerUrl: string
  status: "confirmed"
}
