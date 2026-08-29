import { readFileSync } from "node:fs"
import solc from "solc"
import { createPublicClient, createWalletClient, defineChain, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"

const privateKey = process.env.FORECAST_RELAYER_PRIVATE_KEY
const rpcUrl = process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "https://api.infra.testnet.somnia.network"
if (!privateKey) throw new Error("FORECAST_RELAYER_PRIVATE_KEY is required")
const source = readFileSync(new URL("../contracts/ForecastRegistry.sol", import.meta.url), "utf8")
const output = JSON.parse(solc.compile(JSON.stringify({ language: "Solidity", sources: { "ForecastRegistry.sol": { content: source } }, settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } })))
const artifact = output.contracts["ForecastRegistry.sol"].ForecastRegistry
const account = privateKeyToAccount(privateKey)
const chain = defineChain({ id: 50312, name: "Somnia Shannon", nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } })
const wallet = createWalletClient({ account, chain, transport: http() })
const publicClient = createPublicClient({ chain, transport: http() })
const hash = await wallet.deployContract({ abi: artifact.abi, bytecode: `0x${artifact.evm.bytecode.object}`, args: [account.address] })
const receipt = await publicClient.waitForTransactionReceipt({ hash })
console.log(JSON.stringify({ address: receipt.contractAddress, transactionHash: hash }))
