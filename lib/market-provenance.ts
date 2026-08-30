import { probabilityLabel } from "./format"

export function dreamPulseInterpretation(
  market: { upPrice: number | null },
  room: { upPercent: number },
) {
  const marketText = market.upPrice === null
    ? "DreamDEX has no executable UP quote in the current snapshot."
    : `DreamDEX currently prices UP at ${probabilityLabel(market.upPrice)}.`
  return `${marketText} DreamPulse social conviction is ${room.upPercent}% UP.`
}
