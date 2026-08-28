import { beforeEach, describe, expect, it } from "vitest"
import { clearRooms, getRoom, setConviction } from "./room-store"

describe("room convictions", () => {
  beforeEach(clearRooms)

  it("keeps one replaceable conviction per wallet", () => {
    setConviction("room-1", "0x0000000000000000000000000000000000000001", "UP")
    setConviction("room-1", "0x0000000000000000000000000000000000000001", "DOWN")
    expect(getRoom("room-1")).toMatchObject({ participants: 1, up: 0, down: 1 })
  })
})
