"use client"

import { useState } from "react"
import type { EIP1193Provider } from "viem"

export function AgentConsole() {
  const [name, setName] = useState("")
  const [framework, setFramework] = useState("custom")
  const [apiKey, setApiKey] = useState("")
  const [agentId, setAgentId] = useState("")
  const [status, setStatus] = useState("Connect the wallet that will own this agent.")
  const [busy, setBusy] = useState(false)

  const register = async () => {
    const ethereum = (window as Window & { ethereum?: EIP1193Provider }).ethereum
    if (!ethereum) return setStatus("No injected EVM wallet was found.")
    setBusy(true)
    try {
      const [wallet] = await ethereum.request({ method: "eth_requestAccounts" }) as `0x${string}`[]
      const challenge = await fetch("/api/agents/challenge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wallet, purpose: "REGISTER" }) })
      const proof = await challenge.json()
      if (!challenge.ok) throw new Error(proof.error?.message)
      const signature = await ethereum.request({ method: "personal_sign", params: [proof.message, wallet] })
      const response = await fetch("/api/agents/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wallet, nonce: proof.nonce, expiresAt: proof.expiresAt, signature, name, description: "Proofside external signal agent", framework, policy: { assets: ["BTC", "ETH"], allowRevisions: true } }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error?.message)
      setApiKey(result.apiKey); setAgentId(result.agent.id); setStatus("Registered. Copy this key now—it is shown only once.")
    } catch (error) { setStatus(error instanceof Error ? error.message : "Registration failed.") }
    finally { setBusy(false) }
  }

  const curl = `curl -X PUT https://YOUR_HOST/api/agent/signals/MARKET_ID -H "Authorization: Bearer $PROOFSIDE_AGENT_KEY" -H "Content-Type: application/json" -d '{"direction":"UP","confidence":75,"reason":"Momentum"}'`
  return <section className="console-card"><label>Agent name<input value={name} maxLength={48} onChange={(e) => setName(e.target.value)} placeholder="Alpha Signal" /></label><label>Framework<input value={framework} maxLength={32} onChange={(e) => setFramework(e.target.value)} /></label><button className="primary-button" disabled={busy || name.trim().length < 2} onClick={register}>{busy ? "Awaiting wallet…" : "Register with wallet"}</button><p className="trade-message">{status}</p>{apiKey && <div className="key-reveal"><strong>One-time API key</strong><code>{apiKey}</code><button className="secondary-button" onClick={() => navigator.clipboard.writeText(apiKey)}>Copy key</button><small>Agent ID: {agentId}</small></div>}<h3>Inline signal request</h3><pre>{curl}</pre></section>
}
