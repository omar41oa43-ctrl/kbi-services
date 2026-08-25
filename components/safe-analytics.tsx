"use client"

import { Analytics } from "@vercel/analytics/react"

export function SafeAnalytics() {
  try {
    return <Analytics />
  } catch {
    return null
  }
}
