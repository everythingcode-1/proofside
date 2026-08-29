export type TransactionState =
  | "IDLE"
  | "PREFLIGHT"
  | "AWAITING_SIGNATURE"
  | "BLOCKED"
  | "CANCELLED"
  | "SUBMITTED"
  | "CONFIRMED"
  | "REVERTED"
  | "UNKNOWN"

const ALLOWED: Record<TransactionState, TransactionState[]> = {
  IDLE: ["PREFLIGHT"],
  PREFLIGHT: ["AWAITING_SIGNATURE", "BLOCKED", "CANCELLED"],
  AWAITING_SIGNATURE: ["SUBMITTED", "CANCELLED", "BLOCKED"],
  SUBMITTED: ["CONFIRMED", "REVERTED", "UNKNOWN"],
  BLOCKED: ["PREFLIGHT", "IDLE"],
  CANCELLED: ["PREFLIGHT", "IDLE"],
  CONFIRMED: ["IDLE"],
  REVERTED: ["PREFLIGHT", "IDLE"],
  UNKNOWN: ["PREFLIGHT", "IDLE"],
}

export function transitionTransaction(from: TransactionState, to: TransactionState) {
  if (!ALLOWED[from].includes(to)) throw new Error(`Illegal transaction transition: ${from} -> ${to}`)
  return to
}
