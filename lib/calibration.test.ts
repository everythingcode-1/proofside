import { describe, expect, it } from "vitest"
import { buildCalibrationProfile, rankCalibrationProfiles, scoreForecast } from "./calibration"

describe("calibration", () => {
  it("scores the declared direction with Brier loss", () => {
    expect(scoreForecast("UP", 7200, "UP")).toBeCloseTo(0.0784)
    expect(scoreForecast("DOWN", 7200, "UP")).toBeCloseTo(0.5184)
  })

  it("keeps creators unproven until five settlements", () => {
    const profile = buildCalibrationProfile("alice", "HUMAN", [
      { direction: "UP", confidenceBps: 6000, outcome: "UP", backed: true, revision: 1 },
    ])
    expect(profile.status).toBe("UNPROVEN")
    expect(profile.accuracy).toBe(1)
    expect(profile.meanBrier).toBeCloseTo(0.16)
  })

  it("ranks lower Brier score first", () => {
    const rows = Array.from({ length: 5 }, () => ({ direction: "UP" as const, confidenceBps: 8000, outcome: "UP" as const, backed: false, revision: 1 }))
    const calibrated = buildCalibrationProfile("calibrated", "AGENT", rows)
    const weak = buildCalibrationProfile("weak", "HUMAN", rows.map((row) => ({ ...row, confidenceBps: 5500 })))
    expect(rankCalibrationProfiles([weak, calibrated]).map((profile) => profile.creatorId)).toEqual(["calibrated", "weak"])
    expect(calibrated.status).toBe("RANKED")
  })
})
