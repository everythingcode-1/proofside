import { describe, expect, it, vi } from "vitest"
import { anchorForecast, verifyForecastAnchor } from "./forecast-registry"

const hash = `0x${"1".repeat(64)}` as `0x${string}`
const address = "0xabc0000000000000000000000000000000000123" as const

describe("forecast registry", () => {
  it("fails honestly when registry is not configured", async () => {
    await expect(anchorForecast({ receiptHash: hash, creator: address, marketIdHash: hash, previousReceiptHash: null }, {})).rejects.toThrow("REGISTRY_NOT_CONFIGURED")
  })

  it("anchors and returns confirmed proof", async () => {
    const writeContract = vi.fn().mockResolvedValue(`0x${"2".repeat(64)}`)
    const waitForTransactionReceipt = vi.fn().mockResolvedValue({ status: "success", blockNumber: 42n })
    const proof = await anchorForecast(
      { receiptHash: hash, creator: address, marketIdHash: hash, previousReceiptHash: null },
      { registryAddress: address, privateKey: `0x${"3".repeat(64)}`, writeContract, waitForTransactionReceipt, now: () => 1500 },
    )
    expect(proof).toMatchObject({ block: 42n, anchoredAt: 1500 })
    expect(writeContract).toHaveBeenCalledOnce()
  })

  it("verifies an anchored hash", async () => {
    const readContract = vi.fn().mockResolvedValue(123n)
    await expect(verifyForecastAnchor(hash, { registryAddress: address, readContract })).resolves.toEqual({ anchored: true, anchoredAt: 123 })
  })
})
