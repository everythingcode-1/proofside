# DreamPulse

DreamPulse turns live DreamDEX Event Contracts into autonomous social prediction rooms on Somnia. The host lifecycle discovers a market, explains it with factual data, collects room conviction, routes wallet-signed orders to DreamDEX, and follows the authoritative market state through settlement.

## What works

- Reads active BTC/ETH binary markets from the DreamDEX venue.
- Verifies the current status directly from the onchain market snapshot.
- Displays the live YES/NO book, countdown, question, and contract proof.
- Collects one replaceable UP/DOWN conviction per wallet.
- Connects an injected EVM wallet to Somnia Shannon Testnet.
- Submits an IOC DreamDEX order through `@somnia-chain/markets-sdk`.
- Refuses to display a successful trade without a transaction hash.
- Automatically changes the room copy for locked, settling, resolved, and void markets.

## Run locally

Requirements: Node.js 20+ and an injected EVM wallet such as MetaMask.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a real testnet trade, the connected wallet needs:

- STT for Somnia testnet gas;
- DreamDEX test collateral (tUSDC);
- sufficient resting liquidity on the selected Event Contract.

Copy `.env.example` to `.env.local` only when an endpoint, deployment address, or DreamDEX venue changes. The application ships with the current Bot Kit testnet defaults.

## Verification

```bash
npm test
npm run typecheck
npm run build
npm audit --audit-level=high
```

## Truth boundaries

DreamPulse deliberately distinguishes three concepts:

- **Room conviction** is an unweighted social vote.
- **Market price** is read from the DreamDEX order book.
- **Verified trade** exists only after the wallet signs and DreamPulse receives a Somnia transaction hash.

DreamPulse never stores private keys and never trades autonomously with user funds. The host agent operates the room lifecycle, not the user's wallet.

## MVP limitations

- Convictions use an in-memory single-process store and reset when the server restarts.
- The UI selects one earliest-expiring active BTC/ETH room.
- Order execution is testnet-only and uses deliberate IOC behavior so unfilled remainders do not rest invisibly.
- The testnet venue currently uses tUSDC rather than mainnet USDso.
- No custom smart contract, chat system, creator dashboard, token, or delegated wallet is included.

Add durable storage when deploying multiple server instances. Add creator distribution and embeds only after the complete room loop is validated.

## Demo flow (2–3 minutes)

1. Open DreamPulse and show that the host detected a live DreamDEX Event Contract.
2. Explain the line, countdown, live odds, and room-versus-market distinction.
3. Connect two prepared test wallets and add opposing convictions.
4. Place a small IOC order with one wallet.
5. Reveal the market ID, pool, transaction hash, and Somnia explorer link.
6. Show the room reacting to lock or settlement, then explain how future creator and community integrations distribute the next room.

## Source material

- [DreamDEX Bot Kit](https://github.com/somnia-chain/dreamdex-bot-kit)
- [DreamDEX Event Contract documentation](https://docs.dreamdex.io/developers/event-contracts)
- [Somnia documentation](https://docs.somnia.network/)
