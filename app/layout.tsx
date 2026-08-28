import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "DreamPulse — Autonomous Prediction Rooms",
  description: "Live social prediction rooms powered by DreamDEX Event Contracts on Somnia.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
