"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { EIP1193Provider } from "viem"
import { DREAMDEX } from "@/lib/config"
import { faucetBrowserCollateral } from "@/lib/dreamdex"

type WalletSession = {
  wallet: `0x${string}` | null
  state: "IDLE" | "CONNECTING" | "CLAIMING" | "READY" | "ERROR"
  message: string
  activityNonce: number
  connect: () => Promise<`0x${string}` | null>
  claimCollateral: () => Promise<{ account: `0x${string}`; hash: `0x${string}` } | null>
}

const WalletContext = createContext<WalletSession | null>(null)

const injectedProvider = () => (window as Window & { ethereum?: EIP1193Provider }).ethereum

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<`0x${string}` | null>(null)
  const [state, setState] = useState<WalletSession["state"]>("IDLE")
  const [message, setMessage] = useState("Connect a wallet to use DreamDEX execution.")
  const [activityNonce, setActivityNonce] = useState(0)

  const connect = async () => {
    const provider = injectedProvider()
    if (!provider) { setState("ERROR"); setMessage("No injected EVM wallet was found."); return null }
    setState("CONNECTING"); setMessage("Confirm the Somnia network and account in your wallet…")
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${DREAMDEX.chainId.toString(16)}` }] }).catch(async () => {
        await provider.request({ method: "wallet_addEthereumChain", params: [{ chainId: `0x${DREAMDEX.chainId.toString(16)}`, chainName: "Somnia Shannon Testnet", nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 }, rpcUrls: [DREAMDEX.rpcUrl], blockExplorerUrls: [DREAMDEX.explorerUrl] }] })
      })
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as `0x${string}`[]
      if (!accounts[0]) throw new Error("No wallet account was selected.")
      setWallet(accounts[0]); setState("READY"); setMessage("Wallet ready on Somnia testnet.")
      return accounts[0]
    } catch (error) {
      setState("ERROR"); setMessage(error instanceof Error ? error.message : "Wallet connection was cancelled.")
      return null
    }
  }

  const claimCollateral = async () => {
    const provider = injectedProvider()
    const account = wallet ?? await connect()
    if (!provider || !account) return null
    setState("CLAIMING"); setMessage("Confirm the 10,000 tUSDC faucet transaction…")
    try {
      const result = await faucetBrowserCollateral(provider)
      setActivityNonce((value) => value + 1)
      setState("READY"); setMessage("10,000 tUSDC added to your wallet.")
      return { account, hash: result.hash }
    } catch (error) {
      setState("ERROR"); setMessage(error instanceof Error ? error.message : "The tUSDC faucet transaction failed.")
      return null
    }
  }

  return <WalletContext.Provider value={{ wallet, state, message, activityNonce, connect, claimCollateral }}>{children}</WalletContext.Provider>
}

export function useWalletSession() {
  const session = useContext(WalletContext)
  if (!session) throw new Error("useWalletSession must be used inside WalletProvider")
  return session
}
