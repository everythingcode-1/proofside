import type { PulseStage } from "@/lib/pulse-ui"

const steps = ["MARKET", "SIGNATURE", "SOMNIA", "PROOF"] as const
const labels = { MARKET: "Market", SIGNATURE: "Signal", SOMNIA: "Somnia", PROOF: "Proof" }

export function PulseRail({ stage, status }: { stage: PulseStage; status: string }) {
  const active = stage === "ATTENTION" ? 0 : steps.indexOf(stage)
  return (
    <div className={`pulse-rail ${stage === "ATTENTION" ? "attention" : ""}`} aria-label={status}>
      <div className="pulse-track" aria-hidden="true"><span style={{ transform: `scaleX(${active / (steps.length - 1)})` }} /></div>
      {steps.map((step, index) => <div className="pulse-step" data-active={index === active} data-complete={index < active} key={step}>
        <i aria-hidden="true" />
        <span>{labels[step]}</span>
      </div>)}
    </div>
  )
}
