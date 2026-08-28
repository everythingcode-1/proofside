# DreamPulse Product Brief and Design

**Project:** DreamPulse  
**Tagline:** Autonomous prediction rooms powered by DreamDEX Event Contracts  
**Hackathon:** Somnia x DreamDEX Event Contracts Hackathon  
**Date:** 29 August 2026  
**Status:** Proposed MVP design

## 1. Executive Summary

DreamPulse is an autonomous distribution and engagement layer for DreamDEX Event Contracts. It detects an active Event Contract, turns it into a live social prediction room, guides participants from discovery to an individually wallet-signed trade, follows the contract through settlement, and automatically publishes a result recap.

DreamPulse does not create a competing prediction market or hold user funds. DreamDEX remains the execution, liquidity, and settlement layer. DreamPulse owns the consumer experience around each market: context, participation, crowd conviction, live activity, and repeat engagement.

The core product loop is:

```text
DreamDEX market opens
        -> DreamPulse creates a room
        -> people join and express conviction
        -> each person signs a DreamDEX order
        -> the room follows live market state
        -> DreamDEX settles the market
        -> DreamPulse publishes the result and opens the next room
```

The hackathon prototype will prove this loop with one active BTC or ETH Event Contract on Somnia testnet. It will prioritize a complete, credible demonstration over platform breadth.

## 2. Strategic Context

### 2.1 Somnia's objective

Somnia aims to enable real-time, mass-consumer, fully onchain applications that are impractical on slower or more expensive networks. Its current Agentic L1 positioning adds autonomous agents as first-class network participants capable of observing events, processing data, making decisions, and acting continuously.

The relevant Somnia characteristics are:

- high-throughput EVM-compatible execution;
- sub-second finality and low transaction cost;
- real-time event and state delivery;
- native onchain reactivity on testnet;
- structured onchain data streams;
- infrastructure intended for humans and autonomous agents.

DreamPulse should therefore demonstrate an application that is continuous, reactive, social, and agent-operated—not merely a static dashboard with an AI chat box.

### 2.2 DreamDEX's objective

DreamDEX is a fully onchain central limit order book designed to offer centralized-exchange-quality execution while preserving self-custody and transparent onchain rules. Event Contracts allow users to take a fixed-risk UP or DOWN position over a defined BTC or ETH time window and settle in USDso.

DreamDEX benefits when third-party applications:

- bring new users to its order book;
- produce recurring order flow;
- retain their own consumer or community relationship;
- demonstrate composability;
- create experiences suited to both humans and automated participants.

DreamPulse addresses distribution and engagement rather than duplicating DreamDEX's trading terminal.

### 2.3 Hackathon fit

The project directly addresses the judging criteria:

| Criterion | DreamPulse response |
| --- | --- |
| Innovation and originality | An autonomous agent operates the complete social lifecycle around each Event Contract. |
| Technical implementation | Reads live markets, reacts to lifecycle changes, submits wallet-signed DreamDEX orders, observes settlement, and exposes onchain proof. |
| User experience and design | Reduces a trading terminal to one understandable room, one question, two choices, and visible risk. |
| Business and ecosystem impact | Gives communities and creators a repeatable distribution surface that routes activity into DreamDEX. |
| Presentation and demo | Demonstrates market detection, room creation, participation, order signing, settlement, and recap as one story. |

## 3. Competitive Positioning

Known submissions occupy the following areas:

- Branch: conditional sequences of Event Contracts;
- Rampart: verifiable order-book liquidity quality;
- Sluice Markets: policy-valid position sizing;
- Vitamin M: AI market safety assessment;
- Rivo Intelligence: agent edge validation and shadow testing;
- Market Dungeon: fantasy game wrapper around Event Contracts;
- QDS: broad AI prediction and trading experience.

DreamDEX also already operates Algo Arena, which combines traders, algo builders, linked agent wallets, challenges, and leaderboards. A human-versus-agent competition would therefore be insufficiently differentiated.

DreamPulse occupies a different category:

> It does not improve trading analysis or compete for the best strategy. It autonomously creates audiences and recurring social experiences around DreamDEX liquidity.

The closest future competitor would be an embeddable prediction-market distribution product. The MVP differentiator is the agent-operated market lifecycle rather than a static trading widget.

## 4. Problem Definition

Event Contracts can have efficient execution and visible odds but still suffer from a distribution problem:

- contracts do not explain themselves to new users;
- a conventional exchange interface assumes existing trading intent;
- short-duration markets require timely discovery;
- communities lack a simple shared place to discuss and act on the same contract;
- market settlement usually ends the interaction instead of creating a shareable result and next action;
- manually operating a room for every 15-minute contract does not scale.

The opportunity is to make every contract a self-operating social event.

## 5. Target Users

### 5.1 Primary user: crypto-curious participant

This user understands BTC and ETH direction but may not understand order books. They want:

- a clear question;
- a visible deadline and line to beat;
- transparent maximum loss;
- a simple UP or DOWN action;
- social context without financial jargon;
- proof of the final result.

### 5.2 Distribution user: community host or creator

This user wants a live experience they can share without operating infrastructure or manually updating results. In the MVP, this role is represented by a shareable room URL. Creator dashboards and attribution are roadmap features.

### 5.3 System actor: DreamPulse Host Agent

The Host Agent is not a speculative trading bot. It is responsible for operating the room lifecycle:

- detect;
- explain;
- activate;
- observe;
- settle;
- summarize;
- continue.

Keeping the agent out of user custody and trade execution makes the MVP safer and clearer.

## 6. Product Principles

1. **DreamDEX is the market.** DreamPulse never invents parallel odds or settlement.
2. **Users control funds.** Every user trade requires their own wallet signature.
3. **The agent operates the experience.** AI or automation manages context and lifecycle, not user assets.
4. **Onchain facts are distinguishable from generated commentary.** Market data and transaction proof must be visually labeled.
5. **One screen should tell the story.** A participant should understand the market, risk, crowd, and action without navigating a terminal.
6. **Real-time behavior must be visible.** Countdown, market state, participation, and settlement changes are part of the demo.
7. **A complete narrow loop beats an incomplete platform.** The MVP supports one room lifecycle well.

## 7. Core User Experience

### 7.1 Room discovery

The landing page shows the room for the currently selected active Event Contract. For the MVP, market selection may be automatic with a manual fallback through configuration.

The user sees:

- BTC or ETH;
- contract duration;
- line to beat;
- settlement time and countdown;
- live UP and DOWN market prices;
- room state: opening, live, locked, settling, or settled.

### 7.2 Agent context

The Host Agent produces a short factual introduction based only on known market fields and explicitly supplied market data. The copy must avoid pretending to know future price direction.

Example:

> BTC must finish above $61,046 when this window closes. The market currently prices UP at 54%. Participants in this room are more bullish at 63%.

Generated content is labeled “Host summary.” Onchain market data is labeled “Live from DreamDEX.”

### 7.3 Conviction

Before trading, a participant may select UP or DOWN as their room conviction. This social signal is separate from the trade and does not imply that an order was executed.

The room displays:

- percentage of UP and DOWN convictions;
- number of participants;
- divergence between room conviction and DreamDEX market price.

To prevent misleading presentation, the interface distinguishes:

- **Room conviction:** an unweighted social vote;
- **Market price:** live price from DreamDEX;
- **Verified trade:** a submitted transaction or confirmed order.

### 7.4 Trade

The user connects an EVM wallet on Somnia testnet, selects direction and stake, reviews maximum loss, and signs the DreamDEX order.

The review must show:

- direction;
- stake or quantity;
- displayed price;
- estimated payout when available;
- maximum loss;
- network;
- wallet address;
- explicit confirmation that the order uses DreamDEX.

The application never requests or stores a user private key.

### 7.5 Live state

After submission, the room shows a compact proof state:

- pending signature;
- submitted;
- confirmed or rejected;
- transaction hash;
- explorer link;
- fill/order status when available.

Market and room updates should arrive through a WebSocket or supported DreamDEX/Somnia event mechanism. A modest polling fallback is acceptable if documented and visually indistinguishable.

### 7.6 Settlement and recap

When DreamDEX reports the contract settled, the room transitions automatically to its final state. The Host Agent creates a concise recap using deterministic inputs:

- winning direction;
- final settlement result;
- room majority direction;
- participant count;
- percentage of the room on the winning side;
- relevant transaction or market proof links.

The recap must not invent profit figures when fill and payout information is unavailable.

The result view includes a shareable card and a call to join the next room.

## 8. Functional Requirements

### 8.1 Market adapter

The system must:

- load configured DreamDEX Event Contract metadata;
- read live market state;
- normalize bigint values without converting monetary calculations to floating point prematurely;
- expose direction prices, timing, status, and identifiers to the UI;
- surface unavailable or malformed market data as an explicit error.

USDso decimals must come from metadata or the contract and must not be hard-coded from USDC conventions.

### 8.2 Room lifecycle

The supported state machine is:

```text
OPENING -> LIVE -> LOCKED -> SETTLING -> SETTLED
                    \-> VOID
```

- `OPENING`: metadata is known but participation has not started;
- `LIVE`: conviction and trade actions are available;
- `LOCKED`: the order window has closed;
- `SETTLING`: waiting for authoritative DreamDEX outcome;
- `SETTLED`: result is final and recap is available;
- `VOID`: DreamDEX marks the contract void or no valid outcome is available.

The system must never infer a settlement outcome from local price data when DreamDEX has not finalized it.

### 8.3 Host Agent

For the MVP, the Host Agent is a small lifecycle service with generated copy at two moments:

- room opening;
- room settlement.

All other behavior is deterministic state handling. This avoids building a general multi-agent framework.

If no model API is configured, template-based summaries must keep the entire product functional. AI enhances language; it is not a critical dependency for trading or settlement.

### 8.4 Participation store

The MVP records social conviction with:

- room identifier;
- anonymized or full wallet address;
- selected direction;
- timestamp;
- optional transaction hash after trading.

One wallet has one active conviction per room. A subsequent choice replaces the earlier choice until the room locks.

The simplest persistent store supported by the selected deployment platform is acceptable. Somnia Data Streams may be used if integration is reliable within the hackathon window; otherwise, onchain trade proof remains the authoritative blockchain component and the social layer uses a minimal server-side store.

### 8.5 Wallet and order execution

The application must:

- request connection to Somnia testnet;
- reject unsupported networks with a clear switch-network action;
- validate quantity, tick size, lot size, minimum quantity, token balance, and allowance where applicable;
- simulate the transaction when supported;
- require the user to sign;
- display failures without losing the user's selected direction and stake.

### 8.6 Proof panel

The proof panel must expose:

- Somnia chain ID;
- DreamDEX market or pool address;
- Event Contract identifier;
- user transaction hash after submission;
- explorer link;
- settlement state and source.

This panel is important for technical judging and must be visible during the demo.

## 9. Non-Functional Requirements

### 9.1 Safety

- No custody of user funds.
- No collection of user private keys.
- No invisible autonomous trades on behalf of users.
- Monetary values remain integer-safe until display formatting.
- Generated copy cannot override contract state.
- The UI clearly communicates that the stake can be lost.

### 9.2 Reliability

- The room can restore its state after page reload.
- Market data errors do not show stale values as live.
- A reconnect path exists for WebSocket interruption.
- Settlement is read from the authoritative DreamDEX source.
- Demo mode may use recorded market data only when clearly labeled; it cannot be presented as a live trade.

### 9.3 Accessibility

- UP and DOWN states must not rely on color alone.
- Controls must be keyboard accessible.
- Countdown changes must not constantly interrupt screen readers.
- Form fields and errors require explicit labels.
- Risk and transaction status must be readable at mobile widths.

### 9.4 Performance

- The first useful room view should render before optional agent copy completes.
- Live updates should patch only affected state.
- Large animation or chart dependencies are excluded from the MVP.

## 10. Minimal Architecture

```text
Browser
  - room UI
  - wallet connection
  - DreamDEX order signature
  - live event subscription
        |
        v
Minimal web application server
  - selected-market endpoint
  - room conviction endpoint
  - host summary endpoint
  - lifecycle reconciliation
        |
        +--> DreamDEX contract/API
        +--> Somnia RPC/WebSocket
        +--> minimal room store
        +--> optional language model API
```

The MVP should be one deployable web application. It does not require separate microservices, a message queue, custom indexer, custom smart contract, or agent framework.

### 10.1 Suggested implementation stack

- Next.js with TypeScript;
- React server routes for minimal backend behavior;
- viem for EVM reads and writes;
- DreamDEX Bot Kit or documented contract/API interfaces;
- native WebSocket or supported Somnia/DreamDEX subscription path;
- a small persistent store only if required by deployment;
- CSS/Tailwind according to the initialized application default;
- optional model API with template fallback.

The exact stack must be verified against the repository and current DreamDEX examples before implementation.

## 11. Data Model

### 11.1 Market

```ts
type Market = {
  id: string
  contractAddress: `0x${string}`
  symbol: "BTC" | "ETH"
  durationLabel: string
  lineToBeat: bigint
  upPrice: bigint
  downPrice: bigint
  opensAt: number
  locksAt: number
  settlesAt: number | null
  status: "OPENING" | "LIVE" | "LOCKED" | "SETTLING" | "SETTLED" | "VOID"
  outcome: "UP" | "DOWN" | null
  decimals: number
}
```

### 11.2 Conviction

```ts
type Conviction = {
  roomId: string
  wallet: `0x${string}`
  direction: "UP" | "DOWN"
  createdAt: number
  transactionHash: `0x${string}` | null
}
```

### 11.3 Room summary

```ts
type RoomSummary = {
  roomId: string
  phase: "OPEN" | "RESULT"
  text: string
  generatedAt: number
  sourceFacts: string[]
}
```

No speculative profile, achievement, chat, follower, or creator revenue models are included in the MVP.

## 12. Error Handling

| Failure | Required behavior |
| --- | --- |
| DreamDEX market unavailable | Show unavailable state, retry control, and last successful timestamp without calling it live. |
| Wrong network | Offer a Somnia testnet switch action before enabling trade. |
| Wallet rejected signature | Preserve form values and show a non-alarming cancellation message. |
| Insufficient balance or allowance | Explain the exact requirement and block submission. |
| Order violates tick/lot/minimum | Normalize when safe or display the required valid increment. |
| Transaction reverts | Show decoded or human-readable reason and explorer link when a hash exists. |
| WebSocket disconnects | Mark data as reconnecting and use bounded fallback refresh. |
| Agent copy fails | Render deterministic template copy. Trading remains available. |
| Settlement delayed | Keep the room in SETTLING; never guess the result. |
| Contract voided | Show VOID and avoid winner/loser language. |

## 13. MVP Acceptance Criteria

The prototype is complete only when a reviewer can:

1. open the application and see a real configured DreamDEX Event Contract;
2. understand the question, line to beat, countdown, and maximum risk;
3. connect a wallet on Somnia testnet;
4. register an UP or DOWN room conviction;
5. submit a wallet-signed DreamDEX order or see a precise actionable failure from the live integration;
6. observe a transaction hash and explorer proof after successful submission;
7. observe the room move through its lifecycle using authoritative market state;
8. see a correct settled or void result;
9. see an automatically produced factual recap;
10. reload the page without corrupting the active room state.

## 14. Demo Storyboard

### 0:00-0:20 — Problem

Show DreamDEX as a powerful execution venue, then explain that short-lived Event Contracts do not distribute or operate social experiences by themselves.

### 0:20-0:45 — Autonomous room creation

Show the Host Agent detecting an active BTC or ETH Event Contract and producing a room with line, odds, countdown, and factual context.

### 0:45-1:20 — Participation

Use two wallets or prepared browser profiles to choose opposing convictions. Show the crowd distribution change in real time.

### 1:20-1:55 — Onchain trade

Connect a wallet, review risk, sign a DreamDEX order, and reveal the proof panel with the transaction and explorer link.

### 1:55-2:25 — Settlement

Show the room responding to settlement, publishing the result, and explaining how the crowd performed.

### 2:25-2:50 — Ecosystem impact

Show the room's share link and explain the future creator, community, Telegram/Discord, and embed distribution paths.

### 2:50-3:00 — Vision

Close with: “DreamDEX provides the markets. DreamPulse gives every market an autonomous audience and lifecycle.”

## 15. Success Metrics

Hackathon prototype metrics:

- successful market reads;
- successful wallet connections;
- successful testnet order submissions;
- room participants per contract;
- conviction-to-trade conversion;
- lifecycle transitions completed without manual intervention;
- settlement recap accuracy.

Future product metrics:

- trading wallets introduced to DreamDEX;
- order volume routed through DreamPulse;
- repeat participation across contract windows;
- rooms shared by communities;
- creator conversion and retained communities.

## 16. Deliberate MVP Exclusions

The following are excluded under the Ponytail/YAGNI constraint:

- custom smart contracts;
- custody or delegated user wallets;
- autonomous trading on behalf of users;
- a general-purpose agent platform;
- multi-agent debate;
- full chat or moderation system;
- tokens, NFTs, points, or rewards;
- copy trading;
- creator payouts or referral contracts;
- custom market creation;
- Telegram or Discord production bots;
- embeddable SDK package;
- advanced charts and technical indicators;
- generalized support for every future DreamDEX market type.

These features are valid only after the end-to-end room loop works and there is evidence that they improve adoption.

## 17. Roadmap Beyond the Hackathon

### Phase 1 — Hackathon MVP

One live room, one active market, wallet-signed testnet trade, settlement, recap, and proof panel.

### Phase 2 — Distribution

Shareable cards, creator attribution, Discord/Telegram delivery, and lightweight embeds.

### Phase 3 — Community agents

Configurable host personalities, community-specific room rules, scheduling, and automated content distribution.

### Phase 4 — Open integration

An SDK or API allowing third-party consumer applications to build custom experiences while routing execution to DreamDEX.

## 18. Key Risks and Mitigations

### Integration uncertainty

The exact Event Contract testnet surface, active market availability, and order path must be validated immediately. The product should isolate DreamDEX interaction behind one small adapter so a documented API or contract path can be substituted without changing the room UI.

### Insufficient technical novelty

A shareable page alone is not enough. The demo must visibly prove automatic lifecycle handling, live market state, wallet-signed execution, and settlement reaction.

### Agent gimmick risk

The Host Agent owns useful operational work. Generated prose is intentionally limited. If the model is removed, lifecycle automation still distinguishes the product.

### Empty social room

The demo uses two or more real test wallets or prepared participants. Synthetic participants must never be shown as real users.

### Settlement timing

The demo should use the shortest reliable Event Contract window and record a backup run. A recorded backup must be labeled if used.

### Financial presentation

The product avoids claims of guaranteed returns, clearly states maximum loss, and separates social conviction from financial recommendation.

## 19. Open Validation Items

The following are implementation validation tasks rather than product ambiguities:

- confirm the current DreamDEX Event Contract testnet addresses and ABI/API;
- confirm supported order types and funding/approval flow;
- confirm how Event Contract lock, void, and settlement are represented;
- confirm whether an active short-window testnet market is reliably available;
- confirm Bot Kit support for Event Contracts rather than only spot markets;
- confirm deployment environment and wallet library compatibility;
- determine whether Somnia Reactivity or WebSocket event listening is the shortest reliable live-update path.

If a live integration capability is absent, the limitation must be disclosed; it must not be hidden behind simulated data.

## 20. Final Product Statement

DreamPulse turns DreamDEX Event Contracts into autonomous social experiences. A Host Agent detects each market, creates a live room, explains what is happening, guides people to wallet-signed DreamDEX execution, reacts to settlement, and carries the audience into the next market.

DreamDEX remains the trusted venue. Somnia provides the real-time and agentic infrastructure. DreamPulse provides distribution, participation, and continuity.
