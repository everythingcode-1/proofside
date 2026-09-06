import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { CalibrationProfile } from "./calibration-profile"

it("shows ranking progress and a receipt link for an unproven creator", () => {
  const html = renderToStaticMarkup(<CalibrationProfile profile={{
    creatorId: "proofside-sentinel", creatorType: "AGENT", status: "UNPROVEN", settled: 2,
    accuracy: 0.5, meanBrier: 0.2, calibrationError: 0.1, backedRate: 0, revisionRate: 0,
  }} latestReceiptId="receipt-1" />)

  expect(html).toContain("2/5 settled")
  expect(html).toContain("Lower is better")
  expect(html).toContain('/forecasts/receipt-1')
})
