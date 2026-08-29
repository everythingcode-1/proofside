import { createPublicClient, createWalletClient, defineChain, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { DREAMDEX } from "./config"

const abi = [
  { type: "function", name: "anchor", stateMutability: "nonpayable", inputs: [
    { name: "receiptHash", type: "bytes32" }, { name: "creator", type: "address" }, { name: "marketIdHash", type: "bytes32" }, { name: "previousReceiptHash", type: "bytes32" },
  ], outputs: [] },
  { type: "function", name: "anchoredAt", stateMutability: "view", inputs: [{ name: "receiptHash", type: "bytes32" }], outputs: [{ type: "uint256" }] },
] as const
const ZERO_HASH = `0x${"0".repeat(64)}` as `0x${string}`
const chain = defineChain({ id: DREAMDEX.chainId, name: "Somnia Shannon", nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 }, rpcUrls: { default: { http: [DREAMDEX.rpcUrl] } } })
type AnchorInput = { receiptHash: `0x${string}`; creator: `0x${string}`; marketIdHash: `0x${string}`; previousReceiptHash: `0x${string}` | null }
type Dependencies = { registryAddress?: `0x${string}`; privateKey?: `0x${string}`; writeContract?: (input: Record<string, unknown>) => Promise<`0x${string}`>; waitForTransactionReceipt?: (input: { hash: `0x${string}` }) => Promise<{ status: string; blockNumber: bigint }>; readContract?: (input: Record<string, unknown>) => Promise<unknown>; now?: () => number }
const configuration = (dependencies: Dependencies) => ({ registryAddress: dependencies.registryAddress ?? process.env.FORECAST_REGISTRY_ADDRESS as `0x${string}` | undefined, privateKey: dependencies.privateKey ?? process.env.FORECAST_RELAYER_PRIVATE_KEY as `0x${string}` | undefined })

export async function anchorForecast(input: AnchorInput, dependencies: Dependencies = {}) {
  const config = configuration(dependencies)
  if (!config.registryAddress || !config.privateKey) throw new Error("REGISTRY_NOT_CONFIGURED")
  const account = privateKeyToAccount(config.privateKey)
  const wallet = createWalletClient({ account, chain, transport: http() })
  const publicClient = createPublicClient({ chain, transport: http() })
  const write = dependencies.writeContract ?? ((request) => wallet.writeContract(request as Parameters<typeof wallet.writeContract>[0]))
  const wait = dependencies.waitForTransactionReceipt ?? ((request) => publicClient.waitForTransactionReceipt(request))
  const transactionHash = await write({ address: config.registryAddress, abi, functionName: "anchor", account, chain, args: [input.receiptHash, input.creator, input.marketIdHash, input.previousReceiptHash ?? ZERO_HASH] })
  const receipt = await wait({ hash: transactionHash })
  if (receipt.status !== "success") throw new Error("ANCHOR_REVERTED")
  return { transactionHash, block: receipt.blockNumber, anchoredAt: (dependencies.now ?? Date.now)() }
}

export async function verifyForecastAnchor(receiptHash: `0x${string}`, dependencies: Dependencies = {}) {
  const { registryAddress } = configuration(dependencies)
  if (!registryAddress) throw new Error("REGISTRY_NOT_CONFIGURED")
  const publicClient = createPublicClient({ chain, transport: http() })
  const read = dependencies.readContract ?? ((request) => publicClient.readContract(request as Parameters<typeof publicClient.readContract>[0]))
  const anchoredAt = Number(await read({ address: registryAddress, abi, functionName: "anchoredAt", args: [receiptHash] }))
  return { anchored: anchoredAt > 0, anchoredAt }
}

export const forecastRegistryAbi = abi
