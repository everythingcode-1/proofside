import type { Direction, RoomState } from "./types"

type Vote = { direction: Direction; transactionHash?: `0x${string}`; updatedAt: number }

// ponytail: single-process memory is enough for the hackathon demo; replace with
// durable storage only when the app needs multi-instance deployment.
const rooms = new Map<string, Map<string, Vote>>()

export function setConviction(roomId: string, wallet: string, direction: Direction, transactionHash?: `0x${string}`) {
  const room = rooms.get(roomId) || new Map<string, Vote>()
  room.set(wallet.toLowerCase(), { direction, transactionHash, updatedAt: Date.now() })
  rooms.set(roomId, room)
  return getRoom(roomId)
}

export function getRoom(roomId: string): RoomState {
  const votes = [...(rooms.get(roomId)?.values() || [])]
  const up = votes.filter((vote) => vote.direction === "UP").length
  const down = votes.length - up
  return {
    roomId,
    participants: votes.length,
    up,
    down,
    upPercent: votes.length ? Math.round((up / votes.length) * 100) : 50,
    downPercent: votes.length ? Math.round((down / votes.length) * 100) : 50,
  }
}

export function clearRooms() {
  rooms.clear()
}
