import { describe, expect, it } from "vitest"
import { transitionTransaction } from "./transactions"

describe("transaction state", () => {
  it("keeps submission distinct from confirmation", () => {
    expect(transitionTransaction("AWAITING_SIGNATURE", "SUBMITTED")).toBe("SUBMITTED")
    expect(transitionTransaction("SUBMITTED", "CONFIRMED")).toBe("CONFIRMED")
  })

  it("rejects impossible transitions", () => {
    expect(() => transitionTransaction("IDLE", "CONFIRMED")).toThrow("Illegal transaction transition")
  })
})
