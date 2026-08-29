import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "DreamPulse — Verifiable Forecast Credibility",
  description: "Hybrid forecast receipts for humans and AI, anchored on Somnia and settled by DreamDEX.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
