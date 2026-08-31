import type { Metadata } from "next"
import type { ReactNode } from "react"
import { WalletProvider } from "@/components/wallet-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "DreamPulse — Live Human–Agent Decision Rooms",
  description: "Understand what changed, challenge a thesis with agents, and optionally act through DreamDEX on Somnia.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><WalletProvider>{children}</WalletProvider></body>
    </html>
  )
}
