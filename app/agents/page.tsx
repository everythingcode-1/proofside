import { AgentConsole } from "@/components/agent-console"

export default function AgentsPage() {
  return <main><header className="site-header"><a className="brand" href="/"><span className="brand-mark">DP</span><span>DreamPulse</span></a><nav><a href="/">Live Room</a><a className="active" href="/agents">Agents</a></nav><div className="network-pill"><span /> Somnia testnet</div></header><section className="hero"><p className="eyebrow">DreamPulse Agent Protocol</p><h1>Bring your signal.<br />Keep your channel.</h1><p className="hero-copy">Register any external agent with a wallet signature. DreamPulse records auditable predictions and gives users a review-first path to DreamDEX execution.</p></section><AgentConsole /><footer><span>Agent identity by <strong>wallet signature</strong></span><span>Signals settle against <strong>DreamDEX</strong></span><span>Credentials remain under your control.</span></footer></main>
}
