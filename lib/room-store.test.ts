import { existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { createRoomStore } from "./room-store"

const files: string[] = []
afterEach(() => {
  for (const file of files.splice(0)) {
    for (const suffix of ["", "-shm", "-wal"]) if (existsSync(file + suffix)) rmSync(file + suffix)
  }
})

describe("durable room convictions", () => {
  it("keeps one replaceable conviction after reopen", () => {
    const file = path.join(tmpdir(), `dreampulse-${crypto.randomUUID()}.sqlite`)
    files.push(file)
    const first = createRoomStore(file)
    first.setConviction("room-1", "0x0000000000000000000000000000000000000001", "UP")
    first.setConviction("room-1", "0x0000000000000000000000000000000000000001", "DOWN")
    first.close()

    const second = createRoomStore(file)
    expect(second.getRoom("room-1")).toMatchObject({ participants: 1, up: 0, down: 1 })
    second.close()
  })

  it("records each phase only once in sequence", () => {
    const store = createRoomStore(":memory:")
    expect(store.recordTransition("room-1", null, "LIVE", "snapshot", 1)).toBe(true)
    expect(store.recordTransition("room-1", "LIVE", "LIVE", "snapshot", 2)).toBe(false)
    expect(store.getTransitions("room-1")).toHaveLength(1)
    store.close()
  })
})
