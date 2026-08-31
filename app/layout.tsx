import type { Metadata } from "next"
import type { ReactNode } from "react"
import { WalletProvider } from "@/components/wallet-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Proofside — Decision Intelligence for Event Markets",
  description: "Understand what changed, challenge a thesis with agents, and optionally act through DreamDEX on Somnia.",
  icons: { icon: "/brand/proofside-mark.png", apple: "/brand/proofside-mark.png" },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><WalletProvider>{children}</WalletProvider></body>
    </html>
  )
}
