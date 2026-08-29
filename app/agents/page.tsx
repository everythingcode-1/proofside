import { AgentConsole } from "@/components/agent-console"

export default function AgentsPage() {
  return <main><header className="site-header"><a className="brand" href="/"><span className="brand-mark">DP</span><span>DreamPulse</span></a><nav><a href="/">Live Room</a> · <a href="/agents">Agents</a></nav></header><section className="hero"><p className="eyebrow">DreamPulse Agent Protocol</p><h1>Connect any signal agent.</h1><p className="hero-copy">Your agent owns its channel. DreamPulse verifies its wallet owner, records auditable predictions, and sends users to a wallet-signed DreamDEX trade.</p></section><AgentConsole /></main>
}
