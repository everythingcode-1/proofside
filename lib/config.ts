import { defineChain } from "viem"

const envAddress = (name: string, fallback: `0x${string}`) =>
  (process.env[name] || fallback) as `0x${string}`

export const DREAMDEX = {
  chainId: 50312,
  rpcUrl: process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "https://api.infra.testnet.somnia.network",
  wsUrl: process.env.NEXT_PUBLIC_SOMNIA_WS_URL || "wss://api.infra.testnet.somnia.network/ws",
  indexerUrl: process.env.NEXT_PUBLIC_DREAMDEX_INDEXER_URL || "https://dev.smk.somnia.host/v1/graphql",
  venueId:
    process.env.NEXT_PUBLIC_DREAMDEX_VENUE_ID ||
    "0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c",
  explorerUrl: "https://shannon-explorer.somnia.network",
  decimals: 6,
  tick: 1_000n,
  lot: 1n,
  addresses: {
    collateral: envAddress("NEXT_PUBLIC_DREAMDEX_COLLATERAL", "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E"),
    testUsdc: envAddress("NEXT_PUBLIC_DREAMDEX_COLLATERAL", "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E"),
    binaryModule: envAddress("NEXT_PUBLIC_DREAMDEX_BINARY_MODULE", "0x3ecC694Cef705358864a646142ac17A90E29e388"),
    marketsCore: envAddress("NEXT_PUBLIC_DREAMDEX_MARKETS_CORE", "0x2802504314685D89bF6C992CA5a8e7cC78bc0294"),
    marketCreator: envAddress("NEXT_PUBLIC_DREAMDEX_MARKET_CREATOR", "0x5Ce69567dB39C8fBAd7e048bEfdbcCdfE67B44e6"),
    clobFactory: envAddress("NEXT_PUBLIC_DREAMDEX_CLOB_FACTORY", "0xb2BE8EE02F96379DB75f01802384593EBa9bfF04"),
    binaryPoolImpl: envAddress("NEXT_PUBLIC_DREAMDEX_BINARY_POOL", "0x82A1FcdaA2daC2fC7D5f9909D43E68021eE966FD"),
    binarySettlement: envAddress("NEXT_PUBLIC_DREAMDEX_SETTLEMENT", "0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23"),
    collateralRouter: envAddress("NEXT_PUBLIC_DREAMDEX_ROUTER", "0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C"),
    marketCreatorFactory: envAddress("NEXT_PUBLIC_DREAMDEX_CREATOR_FACTORY", "0xE6bEE93cE87c9E6e62aCb621caa7832EE47b4F6B"),
    oracleHub: envAddress("NEXT_PUBLIC_DREAMDEX_ORACLE_HUB", "0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b"),
  },
} as const

export const somniaTestnet = defineChain({
  id: DREAMDEX.chainId,
  name: "Somnia Shannon Testnet",
  nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: [DREAMDEX.rpcUrl], webSocket: [DREAMDEX.wsUrl] } },
  blockExplorers: { default: { name: "Somnia Explorer", url: DREAMDEX.explorerUrl } },
})
