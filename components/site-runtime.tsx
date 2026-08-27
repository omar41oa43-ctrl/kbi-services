"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const SafeAnalytics = dynamic(
  () => import("@/components/safe-analytics").then((mod) => mod.SafeAnalytics),
  { ssr: false },
)
const GoogleAnalytics = dynamic(
  () => import("@/components/google-analytics").then((mod) => mod.GoogleAnalytics),
  { ssr: false },
)
const UpdateNotification = dynamic(
  () => import("@/components/update-notification").then((mod) => mod.UpdateNotification),
  { ssr: false },
)

/** Loads non-essential monitoring and update UI after the first interaction frame. */
export function SiteRuntime() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const load = () => setReady(true)
    const runtime = globalThis as typeof globalThis & {
      requestIdleCallback?: (_callback: () => void, _options?: { timeout: number }) => number
      cancelIdleCallback?: (_id: number) => void
    }

    if (runtime.requestIdleCallback) {
      const id = runtime.requestIdleCallback(load, { timeout: 4000 })
      return () => runtime.cancelIdleCallback?.(id)
    }

    const id = window.setTimeout(load, 1600)
    return () => window.clearTimeout(id)
  }, [])

  if (!ready) return null

  return (
    <>
      <SafeAnalytics />
      <GoogleAnalytics />
      <UpdateNotification />
    </>
  )
}
