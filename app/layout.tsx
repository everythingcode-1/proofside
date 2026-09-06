import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { WalletProvider } from "@/components/wallet-provider"
import "./globals.css"
import "./reference-theme.css"

export const metadata: Metadata = {
  title: "Proofside — Decision Intelligence for Event Markets",
  description: "Understand what changed, challenge a thesis with agents, and optionally act through DreamDEX on Somnia.",
  icons: {
    icon: [{ url: "/brand/proofside-mark.png", type: "image/png", sizes: "480x480" }],
    apple: [{ url: "/brand/proofside-mark.png", type: "image/png", sizes: "480x480" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d13",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><WalletProvider>{children}</WalletProvider></body>
    </html>
  )
}
